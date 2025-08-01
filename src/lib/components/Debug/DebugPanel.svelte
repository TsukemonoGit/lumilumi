<script lang="ts">
  import { onMount } from "svelte";
  import {
    showDebug,
    debugLogs,
    storageData,
    toggleDebug,
    clearStorage,
    getStorageData,
    debug, // これを使用
    debugInfo,
    debugWarn,
    debugError,
    debugSuccess,
    type LogLevel,
  } from "./debug";

  // 新しく追加する関数（debug.tsに実装）
  function initErrorHandlers() {
    // グローバルエラーハンドラを追加
    window.addEventListener("error", (event) => {
      debugError("Uncaught Error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Promiseの未処理の拒否をキャッチ
    window.addEventListener("unhandledrejection", (event) => {
      debugError("Unhandled Promise Rejection", {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });

    // console.error等をオーバーライド
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      debugError("Console Error", args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      debugWarn("Console Warning", args);
    };
  }

  // ログをクリップボードにコピーする関数
  function copyLogsToClipboard() {
    const logs = $debugLogs;
    const logText = logs
      .map((log) => {
        let text = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
        if (log.details !== undefined) {
          text +=
            "\n" +
            (typeof log.details === "object"
              ? JSON.stringify(log.details, null, 2)
              : log.details);
        }
        return text;
      })
      .join("\n\n");

    navigator.clipboard
      .writeText(logText)
      .then(() => {
        debugSuccess("ログをクリップボードにコピーしました");
      })
      .catch(() => {
        debugError("クリップボードへのコピーに失敗しました");
      });
  }

  // 個別ログをコピーする関数
  function copyLogToClipboard(log: any) {
    let text = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
    if (log.details !== undefined) {
      text +=
        "\n" +
        (typeof log.details === "object"
          ? JSON.stringify(log.details, null, 2)
          : log.details);
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        debugSuccess("ログをコピーしました");
      })
      .catch(() => {
        debugError("コピーに失敗しました");
      });
  }

  function getLogColor(level: LogLevel): string {
    switch (level) {
      case "error":
        return "#ff6b6b"; // 赤
      case "warn":
        return "#ffa726"; // オレンジ
      case "success":
        return "#66bb6a"; // 緑
      case "info":
        return "#42a5f5"; // 青
      case "debug":
        return "#9e9e9e"; // グレー
      default:
        return "#ffffff"; // 白
    }
  }

  function getLevelIcon(level: LogLevel): string {
    switch (level) {
      case "error":
        return "❌";
      case "warn":
        return "⚠️";
      case "success":
        return "✅";
      case "info":
        return "ℹ️";
      case "debug":
        return "🐛";
      default:
        return "📝";
    }
  }

  // テスト用の関数
  function testLogs() {
    debugInfo("情報メッセージです", { userId: 123 });
    debugWarn("警告メッセージです", { reason: "リソース不足" });
    debugError("エラーが発生しました", {
      code: 500,
      message: "Internal Server Error",
    });
    debugSuccess("処理が完了しました", { duration: "1.2s" });
  }

  // エラーを意図的に発生させるテスト関数
  function testConsoleError() {
    console.error("テスト用のコンソールエラー", { test: true });
    console.warn("テスト用の警告");

    // 未処理のエラーを発生
    setTimeout(() => {
      throw new Error("テスト用の未処理エラー");
    }, 100);

    // Promise rejection
    Promise.reject(new Error("テスト用のPromise拒否"));
  }

  onMount(() => {
    // エラーハンドラを初期化
    initErrorHandlers();
  });
</script>

{#if $debug}
  <div style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
    <button
      onclick={toggleDebug}
      style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;"
    >
      {$showDebug ? "Hide Debug" : "Show Debug"}
    </button>
  </div>

  {#if $showDebug}
    <div
      style="
      position: fixed;
      top: 50px;
      right: 10px;
      width: 450px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 9998;
      overflow-y: auto;
      font-family: monospace;
      font-size: 11px;
      word-wrap: break-word;
      border: 1px solid rgba(255, 255, 255, 0.1);
    "
    >
      <h3 style="margin-top: 0; color: #17a2b8;">Debug Panel</h3>

      <div
        style="margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 5px;"
      >
        <button
          onclick={() => getStorageData()}
          style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;"
        >
          Refresh
        </button>
        <button
          onclick={clearStorage}
          style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;"
        >
          Clear Storage
        </button>
        <button
          onclick={testLogs}
          style="background: #6f42c1; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;"
        >
          Test Logs
        </button>
        <button
          onclick={testConsoleError}
          style="background: #fd7e14; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;"
        >
          Test Errors
        </button>
        <button
          onclick={copyLogsToClipboard}
          style="background: #6c757d; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 10px; cursor: pointer;"
        >
          📋 Copy All
        </button>
      </div>

      <h4 style="margin-top: 10px; color: #17a2b8;">LocalStorage Contents:</h4>
      <div
        style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; margin-bottom: 15px;"
      >
        {#each Object.entries($storageData) as [key, value]}
          <div style="margin-bottom: 8px;">
            <strong style="color: #17a2b8;">{key}:</strong>
            <pre
              style="background: rgba(255,255,255,0.1); padding: 6px; border-radius: 3px; max-height: 100px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; margin: 4px 0 0 0; font-size: 10px;">
{value === null ? "null" : JSON.stringify(value, null, 2)}</pre>
          </div>
        {/each}
      </div>

      <h4 style="margin-top: 10px; color: #17a2b8;">Debug Logs:</h4>
      <div
        style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; max-height: 300px; overflow-y: auto;"
      >
        {#each $debugLogs as log}
          <div
            style="
            margin-bottom: 4px; 
            line-height: 1.4; 
            word-break: break-word;
            padding: 6px 8px;
            border-radius: 3px;
            background: rgba(255,255,255,0.03);
            border-left: 3px solid {getLogColor(log.level)};
            position: relative;
          "
          >
            <button
              onclick={() => copyLogToClipboard(log)}
              style="
                position: absolute;
                top: 4px;
                right: 4px;
                background: rgba(255,255,255,0.1);
                color: #ccc;
                border: none;
                padding: 2px 4px;
                border-radius: 2px;
                font-size: 8px;
                cursor: pointer;
                opacity: 0.7;
              "
              title="このログをコピー">📋</button
            >

            <div
              style="display: flex; align-items: center; margin-bottom: 2px; padding-right: 25px;"
            >
              <span style="margin-right: 6px;">{getLevelIcon(log.level)}</span>
              <span
                style="color: {getLogColor(
                  log.level
                )}; font-weight: bold; font-size: 9px; margin-right: 8px;"
              >
                {log.level.toUpperCase()}
              </span>
              <span style="color: #888; font-size: 9px;">
                [{log.timestamp}]
              </span>
            </div>
            <div style="color: {getLogColor(log.level)}; margin-bottom: 4px;">
              {log.message}
            </div>
            {#if log.details !== undefined}
              <details style="margin-top: 4px;">
                <summary style="color: #ccc; font-size: 9px; cursor: pointer;"
                  >詳細</summary
                >
                <pre
                  style="
                  background: rgba(0,0,0,0.3); 
                  padding: 6px; 
                  border-radius: 3px; 
                  max-height: 120px; 
                  overflow-y: auto; 
                  white-space: pre-wrap; 
                  word-break: break-word; 
                  font-size: 9px; 
                  margin: 4px 0 0 0;
                  color: #ddd;
                ">
{typeof log.details === "object"
                    ? JSON.stringify(log.details, null, 2)
                    : log.details}</pre>
              </details>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
