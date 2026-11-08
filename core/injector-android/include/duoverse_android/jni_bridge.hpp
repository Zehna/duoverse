#pragma once

#include <jni.h>

#ifdef __cplusplus
extern "C" {
#endif

// JNI Entry Points exposed to Android Launcher / Java runtime

JNIEXPORT jboolean JNICALL
Java_com_duoverse_runtime_DuoverseBridge_initCoopSession(
    JNIEnv* env,
    jclass clazz,
    jstring roomCode,
    jboolean isHost
);

JNIEXPORT jstring JNICALL
Java_com_duoverse_runtime_DuoverseBridge_getInjectorVersion(
    JNIEnv* env,
    jclass clazz
);

JNIEXPORT jboolean JNICALL
Java_com_duoverse_runtime_DuoverseBridge_isHost(
    JNIEnv* env,
    jclass clazz
);

#ifdef __cplusplus
}
#endif
