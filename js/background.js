;(() => {

    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
        if (req.message === 'autoreload') {
            (async () => {
                try {
                    const res = await fetch(req.url.href, {
                        cache: "no-cache",
                        mode: 'same-origin'
                    })
                    const text = await res.text()
                    sendResponse({
                        data: text,
                        success: true
                    })
                } catch(e) {
                    console.error('Failed to fetch file:', e.message)
                    // 发送错误信息，让content script知道失败了
                    sendResponse({
                        data: null,
                        success: false,
                        error: e.message
                    })
                }
            })()
        }

        return true;
    });

})()
