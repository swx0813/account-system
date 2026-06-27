window.errorLog = [];
window.warningLog = [];
window.MAX_LOG_ITEMS = 100;

window.errorQueue = [];
window.warningQueue = [];

function addErrorToDisplay(error) {
    if (window.errorLog.length >= window.MAX_LOG_ITEMS) {
        window.errorLog.shift();
    }
    window.errorLog.push(error);
    updateErrorDisplay();
}

function addWarningToDisplay(warning) {
    if (window.warningLog.length >= window.MAX_LOG_ITEMS) {
        window.warningLog.shift();
    }
    window.warningLog.push(warning);
    updateWarningDisplay();
}

function addError(error) {
    const errorCounter = document.getElementById('errorCount');
    if (errorCounter) {
        addErrorToDisplay(error);
    } else {
        window.errorQueue.push(error);
    }
}

function addWarning(warning) {
    const warningCounter = document.getElementById('warningCount');
    if (warningCounter) {
        addWarningToDisplay(warning);
    } else {
        window.warningQueue.push(warning);
    }
}

function updateErrorDisplay() {
    const counter = document.getElementById('errorCount');
    const counterBox = document.getElementById('errorCounter');
    if (counter && counterBox) {
        const count = window.errorLog.length;
        counter.textContent = count;
        if (count > 0) {
            counterBox.style.background = '#fee2e2';
            counterBox.style.color = '#dc2626';
        } else {
            counterBox.style.background = '#f3f4f6';
            counterBox.style.color = '#6b7280';
        }
    }
}

function updateWarningDisplay() {
    const counter = document.getElementById('warningCount');
    const counterBox = document.getElementById('warningCounter');
    if (counter && counterBox) {
        const count = window.warningLog.length;
        counter.textContent = count;
        if (count > 0) {
            counterBox.style.background = '#FEF6D5';
            counterBox.style.color = '#92400e';
        } else {
            counterBox.style.background = '#f3f4f6';
            counterBox.style.color = '#6b7280';
        }
    }
}

function flushQueues() {
    while (window.errorQueue.length > 0) {
        const error = window.errorQueue.shift();
        addErrorToDisplay(error);
    }
    while (window.warningQueue.length > 0) {
        const warning = window.warningQueue.shift();
        addWarningToDisplay(warning);
    }
}

window.onerror = function(msg, url, lineNo, columnNo, error) {
    addError({
        type: '全局错误',
        message: msg,
        source: url + ':' + lineNo + ':' + columnNo,
        stack: error?.stack || '',
        time: new Date().toLocaleString('zh-CN')
    });
    return false;
};

window.addEventListener('unhandledrejection', function(event) {
    addError({
        type: 'Promise错误',
        message: event.reason?.message || String(event.reason),
        source: event.reason?.stack || '',
        stack: '',
        time: new Date().toLocaleString('zh-CN')
    });
});

window.addEventListener('error', function(event) {
    if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
        addError({
            type: '资源加载错误',
            message: event.target.tagName + ' 加载失败: ' + (event.target.src || event.target.href),
            source: '',
            stack: '',
            time: new Date().toLocaleString('zh-CN')
        });
    }
}, true);

const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    const errorMsg = args.map(arg => {
        if (typeof arg === 'object') {
            try { return JSON.stringify(arg); }
            catch(e) { return String(arg); }
        }
        return String(arg);
    }).join(' ');
    addError({
        type: 'Console错误',
        message: errorMsg,
        source: '',
        stack: '',
        time: new Date().toLocaleString('zh-CN')
    });
};

const originalConsoleWarn = console.warn;
console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    const warnMsg = args.map(arg => {
        if (typeof arg === 'object') {
            try { return JSON.stringify(arg); }
            catch(e) { return String(arg); }
        }
        return String(arg);
    }).join(' ');
    addWarning({
        type: 'Console警告',
        message: warnMsg,
        source: '',
        stack: '',
        time: new Date().toLocaleString('zh-CN')
    });
};

document.addEventListener('DOMContentLoaded', function() {
    flushQueues();
});