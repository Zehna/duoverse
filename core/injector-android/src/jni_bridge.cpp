#include "duoverse_android/jni_bridge.hpp"
#include "duoverse_android/il2cpp_hook.hpp"

#include <android/log.h>
#include <string>

#define LOG_TAG "DuoverseJNI"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

extern "C" {

JNIEXPORT jboolean JNICALL
Java_com_duoverse_runtime_DuoverseBridge_initCoopSession(
    JNIEnv* env,
    jclass clazz,
    jstring roomCode,
    jboolean isHost
) {
    const char* room_code_chars = env->GetStringUTFChars(roomCode, nullptr);
    std::string code_str = room_code_chars ? room_code_chars : "";
    if (room_code_chars) {
        env->ReleaseStringUTFChars(roomCode, room_code_chars);
    }

    duoverse::android::il2cpp::IL2CPPConfig config;
    config.is_host = (isHost == JNI_TRUE);
    config.room_code = code_str;

    LOGI("[DuoverseJNI] initCoopSession called: Code=%s, isHost=%d",
         code_str.c_str(), config.is_host);

    return duoverse::android::il2cpp::IL2CPPHookEngine::Instance().Initialize(config) ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jstring JNICALL
Java_com_duoverse_runtime_DuoverseBridge_getInjectorVersion(
    JNIEnv* env,
    jclass clazz
) {
    return env->NewStringUTF("0.1.0-android-arm64");
}

JNIEXPORT jboolean JNICALL
Java_com_duoverse_runtime_DuoverseBridge_isHost(
    JNIEnv* env,
    jclass clazz
) {
    return duoverse::android::il2cpp::IL2CPPHookEngine::Instance().IsHostAuthority() ? JNI_TRUE : JNI_FALSE;
}

// JNI_OnLoad automatically invoked when System.loadLibrary("duoverse_injector_android") runs
JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved) {
    LOGI("[DuoverseJNI] JNI_OnLoad invoked: Duoverse Android Injector loaded into process.");
    return JNI_VERSION_1_6;
}

}
