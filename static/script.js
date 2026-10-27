const API_URL = 'fcgi-bin/server.jar';
const AXIS_TICKS = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

let results = [];

const form = document.querySelector('#point-form');
const yInput = document.querySelector('#y-input');
const rInput = document.querySelector('#r-input');
const submitButton = document.querySelector('#submit-button');
const errorDiv = document.querySelector('#error-message');
const xCheckboxes = document.querySelectorAll('input[name="x"]');

const DECIMAL = /^[+-]?\d+(\.\d+)?$/;

function checkNumber(raw, name, min, max) {
    const text = raw.trim().replace(',', '.');
    if (!DECIMAL.test(text)) {
        throw new Error(`${name} должен быть десятичным числом`);
    }
    const value = Number(text);
    const onBound = value === min || value === max;
    const hasFraction = /\.\d*[1-9]/.test(text);
    if (value < min || value > max || (onBound && !hasFraction)) {
        throw new Error(`${name} должен быть строго между ${min} и ${max}`);
    }
    return text;
}

function readSelectedX() {
    const checked = document.querySelector('input[name="x"]:checked');
    if (!checked) {
        throw new Error('Выберите значение X');
    }
    return checked.value;
}

function readForm() {
    return {
        x: readSelectedX(),
        y: checkNumber(yInput.value, 'Y', -5, 5),
        r: checkNumber(rInput.value, 'R', 2, 5)
    };
}

function currentR() {
    try {
        return Number(checkNumber(rInput.value, 'R', 2, 5));
    } catch {
        return null;
    }
}

async function requestHistory(options) {
    const response = await fetch(API_URL, options);
    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error(`Сервер вернул не JSON (HTTP ${response.status})`);
    }
    if (!response.ok) {
        throw new Error(data.error ?? `Ошибка сервера (HTTP ${response.status})`);
    }
    return data.history;
}

function sendPoint(point) {
    const body = new URLSearchParams(point);
    return requestHistory({ method: 'POST', body });
}

function createTableCell(value, className) {
    const cell = document.createElement('td');
    cell.textContent = value;
    if (className) {
        cell.className = className;
    }
    return cell;
}

function renderHistory() {
    const tableBody = document.querySelector('#result-body');
    tableBody.innerHTML = '';
    results.forEach(record => {
        const row = document.createElement('tr');
        row.append(
            createTableCell(record.x),
            createTableCell(record.y),
            createTableCell(record.r),
            createTableCell(record.hit ? 'Попадание' : 'Промах', record.hit ? 'hit' : 'miss'),
            createTableCell(new Date(record.time).toLocaleString('ru-RU')),
            createTableCell(`${(record.execNanos / 1000).toFixed(1)} мкс`)
        );
        tableBody.append(row);
    });
}

function getGraphData() {
    const canvas = document.querySelector('#draw-area');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 40;
    const screenX = x => centerX + x * scale;
    const screenY = y => centerY - y * scale;

    return { canvas, ctx, centerX, centerY, scale, screenX, screenY };
}

function drawGraph(r) {
    const { canvas, ctx } = getGraphData();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (r !== null) {
        drawArea(r);
    }
    drawAxes();

    if (r !== null) {
        results
            .filter(record => Number(record.r) === r)
            .forEach(record => drawPoint(record.x, Number(record.y), record.hit));
    }
}

function drawArea(r) {
    const { ctx, centerX, centerY, scale, screenX, screenY } = getGraphData();

    ctx.fillStyle = 'rgba(207, 81, 213, 0.55)';
    ctx.strokeStyle = '#323d91';
    ctx.lineWidth = 2;

    ctx.fillRect(screenX(-r), screenY(r), r * scale, r * scale);
    ctx.strokeRect(screenX(-r), screenY(r), r * scale, r * scale);

    ctx.beginPath();
    ctx.moveTo(screenX(0), screenY(0));
    ctx.lineTo(screenX(r), screenY(0));
    ctx.lineTo(screenX(0), screenY(r / 2));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(screenX(r), centerY);
    ctx.arc(centerX, centerY, r * scale, 0, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawAxes() {
    const { canvas, ctx, centerX, centerY, screenX, screenY } = getGraphData();

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';

    ctx.beginPath();
    ctx.moveTo(15, centerY);
    ctx.lineTo(canvas.width - 15, centerY);
    ctx.moveTo(centerX, canvas.height - 15);
    ctx.lineTo(centerX, 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width - 15, centerY);
    ctx.lineTo(canvas.width - 25, centerY - 5);
    ctx.moveTo(canvas.width - 15, centerY);
    ctx.lineTo(canvas.width - 25, centerY + 5);
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX - 5, 25);
    ctx.moveTo(centerX, 15);
    ctx.lineTo(centerX + 5, 25);
    ctx.stroke();

    ctx.font = '14px Arial';
    ctx.fillText('X', canvas.width - 25, centerY - 10);
    ctx.fillText('Y', centerX + 10, 25);
    ctx.font = '12px Arial';
    ctx.fillText('0', centerX - 12, centerY + 16);

    AXIS_TICKS.forEach(value => {
        const x = screenX(value);
        const y = screenY(value);

        ctx.beginPath();
        ctx.moveTo(x, centerY - 4);
        ctx.lineTo(x, centerY + 4);
        ctx.moveTo(centerX - 4, y);
        ctx.lineTo(centerX + 4, y);
        ctx.stroke();

        ctx.fillText(value, x - (value < 0 ? 7 : 3), centerY + 18);
        ctx.fillText(value, centerX + 8, y + 4);
    });
}

function drawPoint(x, y, hit) {
    const { ctx, screenX, screenY } = getGraphData();

    ctx.fillStyle = hit ? 'green' : 'red';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(screenX(x), screenY(y), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

xCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            xCheckboxes.forEach(other => {
                if (other !== checkbox) {
                    other.checked = false;
                }
            });
        }
    });
});

rInput.addEventListener('input', () => drawGraph(currentR()));

form.addEventListener('submit', async event => {
    event.preventDefault();

    let point;
    try {
        point = readForm();
    } catch (error) {
        errorDiv.textContent = error.message;
        return;
    }
    errorDiv.textContent = '';

    submitButton.disabled = true;
    try {
        results = await sendPoint(point);
        renderHistory();
        drawGraph(currentR());
    } catch (error) {
        errorDiv.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});

drawGraph(null);
requestHistory({ method: 'GET' })
    .then(data => {
        results = data;
        renderHistory();
        drawGraph(currentR());
    })
    .catch(error => {
        errorDiv.textContent = `Не удалось загрузить историю: ${error.message}`;
    });
