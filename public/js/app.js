const API_URL = 'http://localhost:3000/api';

let officersData = [];
let offendersData = [];
let detentionsData = [];

let searchMatches = [];
let currentSearchIndex = -1;

let currentOfficerId = null;
let currentOffenderId = null;

function showSection(sectionName, element) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.add('d-none');
  });
  
  document.getElementById(`${sectionName}-section`).classList.remove('d-none');
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  if (element) {
    element.classList.add('active');
  }
  
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
  }
}

async function loadOfficers(sortBy = 'LastName', sortOrder = 'ASC') {
  try {
    const response = await fetch(`${API_URL}/officers?sortBy=${sortBy}&sortOrder=${sortOrder}`);
    officersData = await response.json();
    displayOfficers(officersData);
  } catch (error) {
    console.error(error);
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
  currentOfficerId = officerId;
  const modalEl = document.getElementById('officerModal');
  const modal = new bootstrap.Modal(modalEl);
  
  document.getElementById('officerModalLabel').textContent = officerId ? 'Редагувати офіцера' : 'Додати офіцера';
  
  if (officerId) {
    const officer = officersData.find(o => o.officer_id === officerId);
    if (officer) {
        document.getElementById('lastName').value = officer.lastname;
        document.getElementById('firstName').value = officer.firstname;
        document.getElementById('patronymic').value = officer.patronymic || '';
        document.getElementById('rank').value = officer.rank || '';
        document.getElementById('position').value = officer.position || '';
    }
  } else {
    document.getElementById('officerForm').reset();
  }
  
  modal.show();
}

async function saveOfficer() {
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
    const url = currentOfficerId ? `${API_URL}/officers/${currentOfficerId}` : `${API_URL}/officers`;
    const response = await fetch(url, {
      method: currentOfficerId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      const modalEl = document.getElementById('officerModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      
      alert(currentOfficerId ? 'Офіцера оновлено' : 'Офіцера додано');
      loadOfficers();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error(error);
    alert('Помилка збереження');
  }
}

function editOfficer(id) {
  openOfficerModal(id);
}

async function deleteOfficer(id) {
  if (!confirm('Видалити офіцера?')) return;
  try {
    const res = await fetch(`${API_URL}/officers/${id}`, { method: 'DELETE' });
    if (res.ok) loadOfficers();
    else alert('Помилка видалення');
  } catch (e) {
    console.error(e);
  }
}

async function loadOffenders() {
  currentSearchIndex = -1;
  searchMatches = [];
  updateSearchCounter(0, 0);
  document.getElementById('searchOffender').value = '';
  document.getElementById('prevSearchBtn').disabled = true;
  document.getElementById('nextSearchBtn').disabled = true;

  try {
    const response = await fetch(`${API_URL}/offenders`);
    offendersData = await response.json();
    displayOffenders(offendersData);
  } catch (error) {
    console.error(error);
  }
}

function displayOffenders(offenders) {
  const tbody = document.getElementById('offenders-table');
  const searchTerm = document.getElementById('searchOffender')?.value.trim().toLowerCase() || '';

  searchMatches = [];
  
  if (offenders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Порушників немає</td></tr>';
    return;
  }
  
  tbody.innerHTML = offenders.map((offender, index) => {
    const isMatch = searchTerm && (
        offender.lastname.toLowerCase().includes(searchTerm) || 
        offender.firstname.toLowerCase().includes(searchTerm)
    );

    if (isMatch) {
        searchMatches.push(index);
    }

    const isCurrentResult = isMatch && currentSearchIndex >= 0 && 
                           searchMatches[currentSearchIndex] === index;
    
    const rowClass = isCurrentResult ? 'table-active' : '';
    const rowId = isMatch ? `search-match-${searchMatches.length - 1}` : '';

    return `
    <tr class="${rowClass}" id="${rowId}">
      <td>${offender.offender_id}</td>
      <td>${highlightText(offender.lastname, searchTerm)}</td>
      <td>${highlightText(offender.firstname, searchTerm)}</td>
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
  `}).join('');
}

async function searchOffenders() {
  const searchTerm = document.getElementById('searchOffender').value.trim();
  currentSearchIndex = -1;
  searchMatches = [];
  
  if (!searchTerm) {
    loadOffenders();
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/offenders/search?lastName=${encodeURIComponent(searchTerm)}`);
    const results = await response.json();
    offendersData = results;
    displayOffenders(results);

    const total = searchMatches.length;
    updateSearchCounter(total > 0 ? 1 : 0, total);
    
    document.getElementById('prevSearchBtn').disabled = total === 0;
    document.getElementById('nextSearchBtn').disabled = total === 0;

    if (total > 0) {
        currentSearchIndex = 0;
        displayOffenders(results);
        scrollToSearchResult(0);
    }
  } catch (error) {
    console.error(error);
  }
}

function resetOffenderSearch() {
    loadOffenders();
}

function highlightText(text, searchTerm) {
  if (!searchTerm || !text) return text;
  constQP = new RegExp(`(${searchTerm})`, 'gi');
  return text.toString().replace(QP, '<mark>$1</mark>');
}

function navigateSearch(direction) {
  if (searchMatches.length === 0) return;
  currentSearchIndex += direction;
  if (currentSearchIndex >= searchMatches.length) currentSearchIndex = 0;
  else if (currentSearchIndex < 0) currentSearchIndex = searchMatches.length - 1;
  updateSearchCounter(currentSearchIndex + 1, searchMatches.length);
  displayOffenders(offendersData);
  scrollToSearchResult(currentSearchIndex);
}

function scrollToSearchResult(index) {
  const element = document.getElementById(`search-match-${index}`);
  if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateSearchCounter(current, total) {
  const counter = document.getElementById('searchCounter');
  if (counter) counter.textContent = total === 0 ? '' : `Результат ${current} з ${total}`;
}

function openOffenderModal(id = null) {
  currentOffenderId = id;
  const modalEl = document.getElementById('offenderModal');
  const modal = new bootstrap.Modal(modalEl);
  
  document.getElementById('offenderModalLabel').textContent = id ? 'Редагувати порушника' : 'Додати порушника';
  
  if (id) {
    const offender = offendersData.find(o => o.offender_id === id);
    if (offender) {
      document.getElementById('offLastName').value = offender.lastname;
      document.getElementById('offFirstName').value = offender.firstname;
      document.getElementById('offPatronymic').value = offender.patronymic || '';
      document.getElementById('offAddress').value = offender.address || '';
      document.getElementById('offWorkplace').value = offender.workplace || '';
    }
  } else {
    document.getElementById('offenderForm').reset();
  }
  
  modal.show();
}

async function saveOffender() {
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
    const url = currentOffenderId ? `${API_URL}/offenders/${currentOffenderId}` : `${API_URL}/offenders`;
    const response = await fetch(url, {
      method: currentOffenderId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('offenderModal'));
      modal.hide();
      alert(currentOffenderId ? 'Порушника оновлено' : 'Порушника додано');
      loadOffenders();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error(error);
    alert('Помилка збереження');
  }
}

function editOffender(id) {
  openOffenderModal(id);
}

async function deleteOffender(id) {
  if (!confirm('Видалити порушника?')) return;
  try {
    const res = await fetch(`${API_URL}/offenders/${id}`, { method: 'DELETE' });
    if (res.ok) loadOffenders();
    else alert('Помилка видалення');
  } catch (e) {
    console.error(e);
  }
}

async function loadDetentions() {
  try {
    const response = await fetch(`${API_URL}/detentions`);
    detentionsData = await response.json();
    displayDetentions(detentionsData);
  } catch (error) {
    console.error(error);
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
    alert('Вкажіть обидві дати');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/detentions/filter?startDate=${startDate}&endDate=${endDate}`);
    const results = await response.json();
    displayDetentions(results);
  } catch (error) {
    console.error(error);
    alert('Помилка фільтрації');
  }
}

async function openDetentionModal() {
  const modalEl = document.getElementById('detentionModal');
  const modal = new bootstrap.Modal(modalEl);
  
  document.getElementById('detentionForm').reset();
  
  try {
    const [officersRes, offendersRes] = await Promise.all([
      fetch(`${API_URL}/officers`),
      fetch(`${API_URL}/offenders`)
    ]);
    
    const officers = await officersRes.json();
    const offenders = await offendersRes.json();
    
    const offSelect = document.getElementById('detOfficerId');
    offSelect.innerHTML = '<option value="">Оберіть офіцера...</option>' + 
      officers.map(o => `<option value="${o.officer_id}">${o.lastname} ${o.firstname}</option>`).join('');
      
    const offendSelect = document.getElementById('detOffenderId');
    offendSelect.innerHTML = '<option value="">Оберіть порушника...</option>' + 
      offenders.map(o => `<option value="${o.offender_id}">${o.lastname} ${o.firstname}</option>`).join('');
      
    document.getElementById('detDate').max = new Date().toISOString().split('T')[0];
    
    modal.show();
  } catch (e) {
    console.error(e);
    alert('Помилка завантаження списків');
  }
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
      const modal = bootstrap.Modal.getInstance(document.getElementById('detentionModal'));
      modal.hide();
      alert('Затримання додано');
      loadDetentions();
    } else {
      const data = await response.json();
      alert('Помилка: ' + data.error);
    }
  } catch (error) {
    console.error(error);
    alert('Помилка збереження');
  }
}

async function deleteDetention(id) {
  if (!confirm('Видалити затримання?')) return;
  try {
    const res = await fetch(`${API_URL}/detentions/${id}`, { method: 'DELETE' });
    if (res.ok) loadDetentions();
    else alert('Помилка видалення');
  } catch (e) {
    console.error(e);
  }
}

function downloadGeneralReport() {
  window.location.href = `${API_URL}/reports/general-report`;
}

document.addEventListener('DOMContentLoaded', () => {
  loadOfficers();
});