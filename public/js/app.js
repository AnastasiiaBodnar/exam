const API_URL = 'http://localhost:3000/api';

let officersData = [];
let offendersData = [];
let detentionsData = [];

// =============== Navigation ===============
function showSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.add('d-none');
  });
  
  document.getElementById(`${sectionName}-section`).classList.remove('d-none');
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.classList.add('active');
  
  switch(sectionName) {
    case 'officers':
      loadOfficers();
      break;
    case 'offenders':
      loadOffenders();
      break;
    case 'detentions':
      loadDetentions();
      break;
    case 'reports':
      loadReportOfficers();
      break;
  }
}

// =============== Officers ===============
async function loadOfficers(sortBy = 'LastName', sortOrder = 'ASC') {
  try {
    const response = await fetch(`${API_URL}/officers?sortBy=${sortBy}&sortOrder=${sortOrder}`);
    officersData = await response.json();
    displayOfficers(officersData);
  } catch (error) {
    console.error('Error loading officers:', error);
    alert('Помилка завантаження офіцерів');
  }
}

function displayOfficers(officers) {
  const tbody = document.getElementById('officers-table');
  
  if (officers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Офіцерів немає</td></tr>';
    return;
  }
  
  tbody.innerHTML = officers.map(officer => `
    <tr>
      <td>${officer.officer_id}</td>
      <td>${officer.lastname}</td>
      <td>${officer.firstname}</td>
      <td>${officer.patronymic || '-'}</td>
      <td>${officer.rank || '-'}</td>
      <td>${officer.position || '-'}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editOfficer(${officer.officer_id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteOfficer(${officer.officer_id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

let currentSortField = 'LastName';
let currentSortOrder = 'ASC';

function sortOfficers(field) {
  if (currentSortField === field) {
    currentSortOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
  } else {
    currentSortField = field;
    currentSortOrder = 'ASC';
  }
  loadOfficers(currentSortField, currentSortOrder);
}

function openOfficerModal(officerId = null) {
  const isEdit = officerId !== null;
  let formData = { lastname: '', firstname: '', patronymic: '', rank: '', position: '' };
  
  if (isEdit) {
    const officer = officersData.find(o => o.officer_id === officerId);
    if (officer) formData = officer;
  }
  
  document.getElementById('modals-container').innerHTML = `
    <div class="modal fade" id="officerModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${isEdit ? 'Редагувати офіцера' : 'Додати офіцера'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="officerForm">
              <div class="mb-3">
                <label class="form-label">Прізвище *</label>
                <input type="text" class="form-control" id="lastName" value="${formData.lastname || ''}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Ім'я *</label>
                <input type="text" class="form-control" id="firstName" value="${formData.firstname || ''}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">По-батькові</label>
                <input type="text" class="form-control" id="patronymic" value="${formData.patronymic || ''}">
              </div>
              <div class="mb-3">
                <label class="form-label">Звання</label>
                <input type="text" class="form-control" id="rank" value="${formData.rank || ''}">
              </div>
              <div class="mb-3">
                <label class="form-label">Посада</label>
                <input type="text" class="form-control" id="position" value="${formData.position || ''}">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
            <button type="button" class="btn btn-primary" onclick="saveOfficer(${isEdit ? officerId : null})">
              Зберегти
            </button>
          </div>
        </div>
      </div>
    </div>`;
  
  new bootstrap.Modal(document.getElementById('officerModal')).show();
}

async function saveOfficer(officerId) {
  const form = document.getElementById('officerForm');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  const formData = {
    lastName: document.getElementById('lastName').value.trim(),
    firstName: document.getElementById('firstName').value.trim(),
    patronymic: document.getElementById('patronymic').value.trim() || null,
    rank: document.getElementById('rank').value.trim() || null,
    position: document.getElementById('position').value.trim() || null
  };
  
  try {
    const url = officerId ? `${API_URL}/officers/${officerId}` : `${API_URL}/officers`;
    const response = await fetch(url, {
      method: officerId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert(officerId ? 'Офіцера оновлено' : 'Офіцера додано');
      bootstrap.Modal.getInstance(document.getElementById('officerModal')).hide();
      loadOfficers();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка збереження');
  }
}

function editOfficer(officerId) {
  openOfficerModal(officerId);
}

async function deleteOfficer(officerId) {
  if (!confirm('Ви впевнені, що хочете видалити цього офіцера?')) return;
  
  try {
    const response = await fetch(`${API_URL}/officers/${officerId}`, { method: 'DELETE' });
    
    if (response.ok) {
      alert('Офіцера видалено');
      loadOfficers();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка видалення');
  }
}

// =============== Offenders ===============
async function loadOffenders() {
  try {
    const response = await fetch(`${API_URL}/offenders`);
    offendersData = await response.json();
    displayOffenders(offendersData);
  } catch (error) {
    console.error('Error loading offenders:', error);
    alert('Помилка завантаження порушників');
  }
}

function displayOffenders(offenders) {
  const tbody = document.getElementById('offenders-table');
  
  if (offenders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Порушників немає</td></tr>';
    return;
  }
  
  tbody.innerHTML = offenders.map(offender => `
    <tr>
      <td>${offender.offender_id}</td>
      <td>${offender.lastname}</td>
      <td>${offender.firstname}</td>
      <td>${offender.patronymic || '-'}</td>
      <td>${offender.address || '-'}</td>
      <td>${offender.workplace || '-'}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editOffender(${offender.offender_id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteOffender(${offender.offender_id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function searchOffenders() {
  const searchTerm = document.getElementById('searchOffender').value.trim();
  if (!searchTerm) {
    loadOffenders();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/offenders/search?lastName=${encodeURIComponent(searchTerm)}`);
    const results = await response.json();
    displayOffenders(results);
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка пошуку');
  }
}

function openOffenderModal(offenderId = null) {
  const isEdit = offenderId !== null;
  let formData = { lastname: '', firstname: '', patronymic: '', address: '', workplace: '' };
  
  if (isEdit) {
    const offender = offendersData.find(o => o.offender_id === offenderId);
    if (offender) formData = offender;
  }
  
  document.getElementById('modals-container').innerHTML = `
    <div class="modal fade" id="offenderModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${isEdit ? 'Редагувати порушника' : 'Додати порушника'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="offenderForm">
              <div class="mb-3">
                <label class="form-label">Прізвище *</label>
                <input type="text" class="form-control" id="offLastName" value="${formData.lastname || ''}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Ім'я *</label>
                <input type="text" class="form-control" id="offFirstName" value="${formData.firstname || ''}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">По-батькові</label>
                <input type="text" class="form-control" id="offPatronymic" value="${formData.patronymic || ''}">
              </div>
              <div class="mb-3">
                <label class="form-label">Адреса</label>
                <textarea class="form-control" id="offAddress">${formData.address || ''}</textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Місце роботи</label>
                <input type="text" class="form-control" id="offWorkplace" value="${formData.workplace || ''}">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
            <button type="button" class="btn btn-primary" onclick="saveOffender(${isEdit ? offenderId : null})">
              Зберегти
            </button>
          </div>
        </div>
      </div>
    </div>`;
  
  new bootstrap.Modal(document.getElementById('offenderModal')).show();
}

async function saveOffender(offenderId) {
  const form = document.getElementById('offenderForm');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  const formData = {
    lastName: document.getElementById('offLastName').value.trim(),
    firstName: document.getElementById('offFirstName').value.trim(),
    patronymic: document.getElementById('offPatronymic').value.trim() || null,
    address: document.getElementById('offAddress').value.trim() || null,
    workplace: document.getElementById('offWorkplace').value.trim() || null
  };
  
  try {
    const url = offenderId ? `${API_URL}/offenders/${offenderId}` : `${API_URL}/offenders`;
    const response = await fetch(url, {
      method: offenderId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert(offenderId ? 'Порушника оновлено' : 'Порушника додано');
      bootstrap.Modal.getInstance(document.getElementById('offenderModal')).hide();
      loadOffenders();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка збереження');
  }
}

function editOffender(offenderId) {
  openOffenderModal(offenderId);
}

async function deleteOffender(offenderId) {
  if (!confirm('Ви впевнені, що хочете видалити цього порушника?')) return;
  
  try {
    const response = await fetch(`${API_URL}/offenders/${offenderId}`, { method: 'DELETE' });
    
    if (response.ok) {
      alert('Порушника видалено');
      loadOffenders();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка видалення');
  }
}

// =============== Detentions ===============
async function loadDetentions() {
  try {
    const response = await fetch(`${API_URL}/detentions`);
    detentionsData = await response.json();
    displayDetentions(detentionsData);
  } catch (error) {
    console.error('Error loading detentions:', error);
    alert('Помилка завантаження затримань');
  }
}

function displayDetentions(detentions) {
  const tbody = document.getElementById('detentions-table');
  
  if (detentions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Затримань немає</td></tr>';
    return;
  }
  
  tbody.innerHTML = detentions.map(detention => `
    <tr>
      <td>${detention.detention_id}</td>
      <td>${detention.officername}</td>
      <td>${detention.offendername}</td>
      <td>${new Date(detention.detentiondate).toLocaleDateString('uk-UA')}</td>
      <td>${detention.protocolnumber}</td>
      <td>${detention.passportnumber || '-'}</td>
      <td>${detention.violationtype}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteDetention(${detention.detention_id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function filterDetentions() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (!startDate || !endDate) {
    alert('Будь ласка, вкажіть обидві дати!');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/detentions/filter?startDate=${startDate}&endDate=${endDate}`);
    const results = await response.json();
    displayDetentions(results);
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка фільтрації');
  }
}

async function openDetentionModal() {
  const officersResponse = await fetch(`${API_URL}/officers`);
  const officers = await officersResponse.json();
  
  const offendersResponse = await fetch(`${API_URL}/offenders`);
  const offenders = await offendersResponse.json();
  
  document.getElementById('modals-container').innerHTML = `
    <div class="modal fade" id="detentionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Додати затримання</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="detentionForm">
              <div class="mb-3">
                <label class="form-label">Офіцер *</label>
                <select class="form-select" id="detOfficerId" required>
                  <option value="">Оберіть офіцера...</option>
                  ${officers.map(o => `<option value="${o.officer_id}">${o.lastname} ${o.firstname}</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Порушник *</label>
                <select class="form-select" id="detOffenderId" required>
                  <option value="">Оберіть порушника...</option>
                  ${offenders.map(o => `<option value="${o.offender_id}">${o.lastname} ${o.firstname}</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Дата затримання *</label>
                <input type="date" class="form-control" id="detDate" max="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">№ Протоколу *</label>
                <input type="text" class="form-control" id="detProtocol" required>
              </div>
              <div class="mb-3">
                <label class="form-label">№ Паспорту</label>
                <input type="text" class="form-control" id="detPassport">
              </div>
              <div class="mb-3">
                <label class="form-label">Тип порушення *</label>
                <textarea class="form-control" id="detViolation" required></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Скасувати</button>
            <button type="button" class="btn btn-primary" onclick="saveDetention()">
              Зберегти
            </button>
          </div>
        </div>
      </div>
    </div>`;
  
  new bootstrap.Modal(document.getElementById('detentionModal')).show();
}

async function saveDetention() {
  const form = document.getElementById('detentionForm');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  const formData = {
    officerId: parseInt(document.getElementById('detOfficerId').value),
    offenderId: parseInt(document.getElementById('detOffenderId').value),
    detentionDate: document.getElementById('detDate').value,
    protocolNumber: document.getElementById('detProtocol').value.trim(),
    passportNumber: document.getElementById('detPassport').value.trim() || null,
    violationType: document.getElementById('detViolation').value.trim()
  };
  
  try {
    const response = await fetch(`${API_URL}/detentions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      alert('Затримання додано');
      bootstrap.Modal.getInstance(document.getElementById('detentionModal')).hide();
      loadDetentions();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка збереження');
  }
}

async function deleteDetention(detentionId) {
  if (!confirm('Ви впевнені, що хочете видалити це затримання?')) return;
  
  try {
    const response = await fetch(`${API_URL}/detentions/${detentionId}`, { method: 'DELETE' });
    
    if (response.ok) {
      alert('Затримання видалено');
      loadDetentions();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка видалення');
  }
}

// =============== Reports ===============
async function loadReportOfficers() {
  try {
    const response = await fetch(`${API_URL}/officers`);
    const officers = await response.json();
    
    const select = document.getElementById('reportOfficerId');
    select.innerHTML = '<option value="">Оберіть офіцера...</option>' +
      officers.map(o => `<option value="${o.officer_id}">${o.lastname} ${o.firstname} - ${o.position || 'Немає посади'}</option>`).join('');
  } catch (error) {
    console.error('Error:', error);
  }
}

async function generateOfficerReport() {
  const officerId = document.getElementById('reportOfficerId').value;
  if (!officerId) {
    alert('Оберіть офіцера!');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/reports/officer-detentions/${officerId}`);
    const data = await response.json();
    
    const resultDiv = document.getElementById('officerReportResult');
    
    if (data.detentions.length === 0) {
      resultDiv.innerHTML = '<div class="alert alert-info">Затримань не знайдено</div>';
      return;
    }
    
    let html = `
      <div class="alert alert-success">
        <h5>Офіцер: ${data.officer.lastname} ${data.officer.firstname}</h5>
        <p><strong>Посада:</strong> ${data.officer.position || '-'}</p>
        <p><strong>Загальна кількість затримань:</strong> ${data.totalCount}</p>
      </div>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Порушник</th>
            <th>№ Протоколу</th>
            <th>Тип порушення</th>
          </tr>
        </thead>
        <tbody>`;
    
    data.detentions.forEach(det => {
      html += `
        <tr>
          <td>${new Date(det.detentiondate).toLocaleDateString('uk-UA')}</td>
          <td>${det.offendername}</td>
          <td>${det.protocolnumber}</td>
          <td>${det.violationtype}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    resultDiv.innerHTML = html;
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка формування звіту');
  }
}

async function queryViolationCount() {
  const lastName = document.getElementById('queryOffenderLastName').value.trim();
  if (!lastName) {
    alert('Введіть прізвище порушника!');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/reports/offender-violations?lastName=${encodeURIComponent(lastName)}`);
    
    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }
    
    const data = await response.json();
    
    const resultDiv = document.getElementById('violationCountResult');
    resultDiv.innerHTML = `
      <div class="alert alert-warning">
        <h5>${data.lastname} ${data.firstname} ${data.patronymic || ''}</h5>
        <p><strong>Адреса:</strong> ${data.address || 'Немає даних'}</p>
        <p><strong>Місце роботи:</strong> ${data.workplace || 'Немає даних'}</p>
        <p style="font-size: 24px; color: #dc3545; font-weight: bold; margin-top: 10px;">
          Кількість правопорушень: ${data.violationcount}
        </p>
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
    alert('Помилка виконання запиту');
  }
}

// =============== Initial Load ===============
document.addEventListener('DOMContentLoaded', () => {
  loadOfficers();
});