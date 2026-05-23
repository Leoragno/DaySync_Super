# Capacitor ProGuard Rules
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.Bridge { *; }

# Preserve line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes *Annotation*

# For JS bridge stability
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Supabase / OkHttp / Coroutines stability (if using native SDKs later)
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class com.fasterxml.jackson.** { *; }
-keepnames class com.google.gson.** { *; }
