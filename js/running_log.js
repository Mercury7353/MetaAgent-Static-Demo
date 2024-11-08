async function loadRunningLog() {
    try {
        const response = await fetch('data/running_log.txt');
        const text = await response.text();
        const logContainer = document.getElementById('running-log');
        logContainer.innerHTML = marked.parse(text);
    } catch (error) {
        console.error('Error loading running log:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadRunningLog); 