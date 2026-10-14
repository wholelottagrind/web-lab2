const API_URL = 'fcgi-bin/server.jar';
const DEFAULT_R = 4;

const state = {
    history: []
};

const form = document.querySelector('#point-form');
const yInput = document.querySelector('#y-input');
const rInput = document.querySelector('#r-input');
const submitButton = document.querySelector('#submit-button');
const errorDiv = document.querySelector('#error-message');
const xCheckboxes = document.querySelectorAll('input[name="x"]');

const DECIMAL = /^([+-]?)(\d+)(?:[.,](\d+))?$/;
const MAX_NUMBER_LENGTH = 30;

function compareWithInteger(text, bound) {
    const [, sign, intPart, fracPart = ''] = text.match(DECIMAL);
    const whole = BigInt(intPart);
    const hasFraction = /[1-9]/.test(fracPart);
    const target = BigInt(sign === '-' ? -bound : bound);
    const cmp = whole > target ? 1 : whole < target ? -1 : (hasFraction ? 1 : 0);
    return sign === '-' ? -cmp : cmp;
}

function parseInOpenInterval(raw, name, min, max) {
    const text = raw.trim();
    if (text.length > MAX_NUMBER_LENGTH || !DECIMAL.test(text)) {
        throw new Error(`${name} должен быть десятичным числом`);
    }
    if (compareWithInteger(text, min) <= 0 || compareWithInteger(text, max) >= 0) {
        throw new Error(`${name} должен быть строго между ${min} и ${max}`);
    }
    return text.replace(',', '.');
}

function readSelectedX() {
    const checked = [...xCheckboxes].filter(checkbox => checkbox.checked);
    if (checked.length !== 1) {
        throw new Error('Выберите одно значение X');
    }
    return checked[0].value;
}

function readForm() {
    return {
        x: readSelectedX(),
        y: parseInOpenInterval(yInput.value, 'Y', -5, 5),
        r: parseInOpenInterval(rInput.value, 'R', 2, 5)
    };
}

function currentR() {
    try {
        return Number(parseInOpenInterval(rInput.value, 'R', 2, 5));
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

function loadHistory() {
    return requestHistory({ method: 'GET' });
}

function sendPoint(point) {
    const body = new URLSearchParams(point);
    return requestHistory({ method: 'POST', body });
}

function createTableCell(value, className) {
    const cell = document.createElement('td');
    cell.textContent = String(value);
    if (className) {
        cell.className = className;
    }
    return cell;
}

function renderHistory() {
    const tableBody = document.querySelector('#result-body');
    tableBody.replaceChildren();
    state.history.forEach(record => {
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
    const { canvas, ctx, centerX, centerY, scale, screenX, screenY } = getGraphData();
    const size = r ?? DEFAULT_R;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(207, 81, 213, 0.55)';
    ctx.strokeStyle = '#323d91';
    ctx.lineWidth = 2;

    ctx.fillRect(screenX(-size), screenY(size), size * scale, size * scale);
    ctx.strokeRect(screenX(-size), screenY(size), size * scale, size * scale);

    ctx.beginPath();
    ctx.moveTo(screenX(0), screenY(0));
    ctx.lineTo(screenX(size), screenY(0));
    ctx.lineTo(screenX(0), screenY(size / 2));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(screenX(size), centerY);
    ctx.arc(centerX, centerY, size * scale, 0, Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawAxes(r);

    if (r !== null) {
        state.history
            .filter(record => Number(record.r) === r)
            .forEach(record => drawPoint(record.x, Number(record.y), record.hit));
    }
}

function drawAxes(r) {
    const { canvas, ctx, centerX, centerY, screenX, screenY } = getGraphData();
    const size = r ?? DEFAULT_R;

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '14px Arial';

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

    ctx.fillText('X', canvas.width - 25, centerY - 10);
    ctx.fillText('Y', centerX + 10, 25);

    const ticks = [
        { value: -size, label: r === null ? '-R' : String(-r) },
        { value: -size / 2, label: r === null ? '-R/2' : String(-r / 2) },
        { value: size / 2, label: r === null ? 'R/2' : String(r / 2) },
        { value: size, label: r === null ? 'R' : String(r) }
    ];
    ticks.forEach(({ value, label }) => {
        const x = screenX(value);
        const y = screenY(value);

        ctx.beginPath();
        ctx.moveTo(x, centerY - 5);
        ctx.lineTo(x, centerY + 5);
        ctx.moveTo(centerX - 5, y);
        ctx.lineTo(centerX + 5, y);
        ctx.stroke();

        ctx.fillText(label, x - 8, centerY + 20);
        ctx.fillText(label, centerX + 10, y + 5);
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
        state.history = await sendPoint(point);
        renderHistory();
        drawGraph(currentR());
    } catch (error) {
        errorDiv.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});

drawGraph(null);
loadHistory()
    .then(history => {
        state.history = history;
        renderHistory();
        drawGraph(currentR());
    })
    .catch(error => {
        errorDiv.textContent = `Не удалось загрузить историю: ${error.message}`;
    });
