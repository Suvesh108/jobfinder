package com.jobfinder.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            WebView webView = this.getBridge().getWebView();
            webView.addJavascriptInterface(new NativeUpdaterInterface(this, webView), "NativeUpdater");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static class NativeUpdaterInterface {
        private final Context context;
        private final WebView webView;

        public NativeUpdaterInterface(Context context, WebView webView) {
            this.context = context;
            this.webView = webView;
        }

        @JavascriptInterface
        public void downloadAndInstall(final String downloadUrl, final String fileName) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        URL url = new URL(downloadUrl);
                        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                        connection.setRequestMethod("GET");
                        connection.setConnectTimeout(15000);
                        connection.setReadTimeout(45000);
                        connection.setInstanceFollowRedirects(true);
                        connection.connect();

                        // Follow redirects if needed
                        int status = connection.getResponseCode();
                        if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                            String newUrl = connection.getHeaderField("Location");
                            connection = (HttpURLConnection) new URL(newUrl).openConnection();
                            connection.connect();
                        }

                        int totalBytes = connection.getContentLength();
                        if (totalBytes <= 0) totalBytes = 5 * 1024 * 1024;

                        File targetDir = context.getExternalFilesDir(null);
                        if (targetDir == null) {
                            targetDir = context.getCacheDir();
                        }
                        File apkFile = new File(targetDir, fileName != null ? fileName : "JobFinder-update.apk");

                        InputStream input = connection.getInputStream();
                        FileOutputStream output = new FileOutputStream(apkFile);

                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        int totalDownloaded = 0;

                        while ((bytesRead = input.read(buffer)) != -1) {
                            output.write(buffer, 0, bytesRead);
                            totalDownloaded += bytesRead;
                            
                            final int pct = Math.min(99, (int) (((long) totalDownloaded * 100) / totalBytes));
                            final String loadedMb = String.format("%.1f", totalDownloaded / (1024.0 * 1024.0));
                            final String totalMb = String.format("%.1f", totalBytes / (1024.0 * 1024.0));

                            webView.post(new Runnable() {
                                @Override
                                public void run() {
                                    webView.evaluateJavascript(
                                        "window.__onNativeUpdateProgress && window.__onNativeUpdateProgress(" + pct + ", '" + loadedMb + "', '" + totalMb + "');",
                                        null
                                    );
                                }
                            });
                        }

                        output.flush();
                        output.close();
                        input.close();

                        // Notify 100% complete to webview
                        webView.post(new Runnable() {
                            @Override
                            public void run() {
                                webView.evaluateJavascript(
                                    "window.__onNativeUpdateComplete && window.__onNativeUpdateComplete();",
                                    null
                                );
                            }
                        });

                        // Launch Native Package Installer Intent
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        Uri apkUri = FileProvider.getUriForFile(
                            context,
                            context.getPackageName() + ".fileprovider",
                            apkFile
                        );

                        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(intent);

                    } catch (final Exception e) {
                        e.printStackTrace();
                        webView.post(new Runnable() {
                            @Override
                            public void run() {
                                webView.evaluateJavascript(
                                    "window.__onNativeUpdateError && window.__onNativeUpdateError('" + e.getMessage() + "');",
                                    null
                                );
                            }
                        });
                    }
                }
            }).start();
        }
    }
}
