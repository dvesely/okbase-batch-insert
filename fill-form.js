(async function (){

    const from = new Date(2021, 1, 22, 8, 10);
    const to = new Date(2021, 1, 26, 9, 10);
    const grid = document.querySelector('.dgrid.PlanovaniGrid');

    if (grid == null) throw `Grid was not found.`;

    await addDays(grid, from, to);

})();

/**
 * 
 * @param {Date} from 
 * @param {Date} to 
 */
async function addDays(grid, from, to) {
    const timeFrom = getTime(from);
    const timeTo = getTime(to);

    let date = getDate(from);           

    while (date <= to) {
        if (isBusinessDay(date)) {
            const record = { 
                from: getDateTime(date, timeFrom),
                to: getDateTime(date, timeTo)
            };

            await insertRecord(grid, record);
        }

        date.setDate(date.getDate() + 1); // add day
    }
}

async function insertRecord(grid, { from, to }) {
    const insertButton = document.querySelector(".ContextMenuButton.is-vlozit");
    insertButton.click();
  
    const dialog = await findElement(".planovani-dialog");
    const form = await findElement(".PlanovaniDetail", dialog);
    //const formId = form.id;
    
    const typyPreruseni = findFormElement(form, 'typyPreruseni');
    const btnOdDo = typyPreruseni.querySelector('.ButtonSelect');

    btnOdDo.click();

    await wait(100); // wait to init select boxes

    await Promise.all([
        setSelectBox(form, 'preruseniZacatek', 'Home office'),
        setSelectBox(form, 'preruseniKonec', 'Obecný KONEC'),        
        setTextBox(form, 'casOd', formatTime(from)),        
        setTextBox(form, 'casDo', formatTime(to)),
    ]); 

    await setDateTextBox(form, 'datumOd', formatDate(from));       
    await setDateTextBox(form, 'datumDo_', formatDate(to));

    // insert
    const btnSubmit = dialog.querySelector('.button-primary .dijitButtonNode');
    btnSubmit.click();
    console.log(btnSubmit);

    // check if was inserted
    const maxWait = 3000;
    let waiting = 0;

    while (true) {        
        await wait(200);
        waiting += 200;

        if (await hasRecord(grid, { from, to })) {
            return;
        } 
        
        if (waiting > maxWait) {
            throw `Inserting '${from.toLocaleString()} - ${to.toLocaleString()}' item timeout.`;
        }
    }
}

async function hasRecord(grid, {from, to}) {
    const begins = grid.querySelectorAll('.dgrid-content td.field-zacatek');

    for (const begin of begins) {
        const dateFrom = parseDateTimeFromGrid(begin.innerText);
        
        if (!isValidDate(dateFrom) || !isEqualDateTime(from, dateFrom)) continue;

        const end = begin.parentElement.querySelector('td.field-konec');
        const dateTo = parseDateTimeFromGrid(end.innerText);

        if (!isValidDate(dateTo) || !isEqualDateTime(to, dateTo)) continue;

        return true;
    }

    return false;
}

function isBusinessDay(date) {
    return !isWeekend(date);
}

function isWeekend(date) {
    return date.getDay() === 0 // sunday
    || date.getDay() === 6; // saturday
}

function isEqualDateTime(d1, d2) {
    return compareDate(d1, d2) < 1000;
}

function compareDate(d1, d2) {
    return d1.getTime() - d2.getTime();
}

function isValidDate(date) {
    return date && date.getTime && typeof date.getTime === 'function' && date.getTime() > 0;
}

/**
 * 
 * @param {Date} date 
 * @param {Date} time 
 */
function getDateTime(date, time) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());
}

/**
 * 
 * @param {Date} date 
 */
function getTime(date) {
    return new Date(0, 0, 1, date.getHours(), date.getMinutes(), date.getSeconds());
}

/**
 * 
 * @param {Date} date 
 */
function getDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 
 * @param {string} dateTime 
 */
function parseDateTimeFromGrid(dateTime) {
    const [date, time] = dateTime.trim().split(' ');
    const [day, month, year] = date.split('.');
    const [hours, minutes] = time.split(':');

    return new Date(year, Number(month) - 1, day, hours, minutes);
}

/**
 * 
 * @param {Date} date 
 */
function formatDateJson(date) {
    return [
        date.getFullYear(),        
        date.getMonth() + 1,       
        date.getDate(),
    ].join('-');
}

/**
 * 
 * @param {Date} date 
 */
function formatDate(date) {
    return [
        date.getDate(),
        date.getMonth() + 1,        
        date.getFullYear(),        
    ].join('.');
}

/**
 * 
 * @param {Date} date 
 */
function formatTime(date) {
    return date.getHours() + ':' + date.getMinutes();
}

/**
 * 
 * @param {number} num 
 */
function addZero(num) {
    return num < 10 ? '0' + num : num;
}

async function setDateTextBox(form, name, date) {
    const widget = findWidgetElement(form, name);    

    if (widget === null) throw `Widget DateBox '${name}' not found.`;

    const tb = findFormElement(form, name);

    if (tb == null) throw `Widget DateBox '${name}' has not TextBox.`;

    //const hidden = tb.parentElement.querySelector('input[type="hidden"]');

    //if (hidden == null) throw `DateTextBox '${name}' hidden input not exists.`;
    
    fireEvent(widget, 'focus');
    
    await wait(200);
    
    tb.value = date;
    fireEvent(widget, 'blur');
    
    await wait(200);

    fireEvent(widget, 'focus');
    fireEvent(widget, 'blur');
}

async function setTextBox(form, name, value) {
    const tb = findFormElement(form, name);

    if (tb === null) throw `TextBox '${name}' not found.`;

    tb.value = value;
}

async function setSelectBox(form, name, textValue) {
    const sb = findWidgetElement(form, name);

    if (sb == null) throw `SelectBox '${name}' was not found.`;

    const btnArrow = sb.querySelector('.dijitArrowButton');

    if (btnArrow == null) throw `SelectBox '${name}' btnArrow not found.`;

    fireEvent(btnArrow, 'pointerdown');

    const items = (await findElement(`#${form.id}_${name}_popup`)).querySelectorAll('.dijitMenuItem');

    textValue = textValue && textValue.toUpperCase();

    let found = false;

    for (const item of items) {
        if (item.innerText.toUpperCase() === textValue) {
            item.click();
            found = true;
            break;
        }
    }    

    if (!found) throw `SelectBox '${name}' item '${textValue}' not found.`;
}

function findFormElement(form, name) {
    const ctrl = form.querySelector(`#${form.id}_${name}`);

    return ctrl;
}

function findWidgetElement(form, name) {
    const ctrl = form.querySelector(`#widget_${form.id}_${name}`);

    return ctrl;
}

async function findElement(selector, parent, callback) {
    const ms = 200;
    const maxTime = 3000; // 3 sec

    const test = parent == null ? document : parent;

    return new Promise((resolve, reject) => {
      let current = 0;

      setInterval(function () {      
        if (current >= maxTime) {
          reject(`Selector '${selector}' not found after ${maxTime/1000}secs.`);
        }
        current += ms;
  
        const el = test.querySelector(selector);
  
        if (el !== null) {
            if (typeof callback === 'function') {
                resolve(callback(el));
            } else {
                resolve(el);
            }          
        };
      }, ms);
    });  
  }

function fireEvent(el, name) {    
    el.dispatchEvent(new Event(name));
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}