const UI = {
    state: {
        pacientes: [],
        obrasSociales: [],
        cirugias: []
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        
        // Listen to auth changes to load data
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (session) {
                    this.loadInitialData();
                }
            }
        });
    },

    cacheDOM() {
        this.tbody = document.getElementById('patients-tbody');
        this.cardsContainer = document.getElementById('patients-cards');
        this.loading = document.getElementById('loading-indicator');
        this.noResults = document.getElementById('no-results');
        
        // Views
        this.mainView = document.querySelector('.app-content:not(#dashboard-view)');
        this.dashboardView = document.getElementById('dashboard-view');
        
        // Nav
        this.navPacientes = document.getElementById('nav-pacientes');
        this.navDashboard = document.getElementById('nav-dashboard');
        
        this.searchInput = document.getElementById('search-input');
        this.filterOs = document.getElementById('filter-os');
        this.filterCirugia = document.getElementById('filter-cirugia');
        this.filterMonth = document.getElementById('filter-month');
        this.filterPanel = document.getElementById('filter-panel');
        
        this.modal = document.getElementById('patient-modal');
        this.form = document.getElementById('patient-form');
        this.modalTitle = document.getElementById('modal-title');
        
        this.obraSocialSelect = document.getElementById('obra_social');
        this.cirugiaList = document.getElementById('cirugia-list');
        
        // Buttons
        this.btnNew = document.getElementById('btn-new-patient');
        this.btnExport = document.getElementById('btn-export-csv');
        this.btnFilterToggle = document.getElementById('btn-filter-toggle');
        this.btnClearFilters = document.getElementById('btn-clear-filters');
        this.closeButtons = document.querySelectorAll('.close-modal');
        
        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toast-message');
    },

    bindEvents() {
        if(this.btnNew) this.btnNew.addEventListener('click', () => this.openModal());
        
        if(this.btnExport) {
            this.btnExport.addEventListener('click', () => {
                const mesActivo = this.filterMonth ? this.filterMonth.value : '';
                const resultado = Exportar.descargarPDF(this.state.pacientes, mesActivo || null);
                if (resultado.exito) {
                    this.showToast(resultado.mensaje);
                } else {
                    this.showToast(resultado.mensaje, 'error');
                }
            });
        }


        // Toggle filtros
        if(this.btnFilterToggle) {
            this.btnFilterToggle.addEventListener('click', () => {
                if(this.filterPanel) {
                    this.filterPanel.classList.toggle('hidden');
                    this.btnFilterToggle.textContent = this.filterPanel.classList.contains('hidden')
                        ? '⚙️ Filtros' : '✖ Filtros';
                }
            });
        }

        // Limpiar filtros
        if(this.btnClearFilters) {
            this.btnClearFilters.addEventListener('click', () => {
                if(this.filterOs) this.filterOs.value = '';
                if(this.filterCirugia) this.filterCirugia.value = '';
                if(this.filterMonth) this.filterMonth.value = '';
                if(this.searchInput) this.searchInput.value = '';
                this.loadPacientes();
            });
        }
        
        if(this.navPacientes) {
            this.navPacientes.addEventListener('click', () => this.switchView('pacientes'));
        }
        if(this.navDashboard) {
            this.navDashboard.addEventListener('click', () => {
                this.switchView('dashboard');
                if(window.Dashboard) window.Dashboard.update(this.state.pacientes);
            });
        }
        
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            });
        });

        if(this.form) this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Filters
        if(this.searchInput) this.searchInput.addEventListener('input', this.debounce(() => this.loadPacientes(), 300));
        if(this.filterOs) this.filterOs.addEventListener('change', () => this.loadPacientes());
        if(this.filterCirugia) this.filterCirugia.addEventListener('change', () => this.loadPacientes());
        if(this.filterMonth) this.filterMonth.addEventListener('change', () => this.loadPacientes());
    },

    async loadInitialData() {
        this.showLoading(true);
        await this.loadPacientes();
        await this.loadCatalogos();
        this.populateMonthFilter();
        this.showLoading(false);
    },

    async loadCatalogos() {
        const defaultOS = ['PAMI', 'DOSEP', 'OSECAC', 'OSPRERA', 'NOBIS', 'OSETYA', 'OTAC', 'OSPIA', 'OSPECON', 'OSUTHGRA', 'SANCOR', 'SWISS MEDICAL', 'GALENO', 'IOSFA', 'ATSA', 'MEDISALUD', 'ASSIMRA', 'OSFA', 'LUZ Y FUERZA', 'ISPICA', 'OSFATUN', 'MUTUAL MEDICA', 'SALUD PLENA', 'ANDES SALUD', 'UOM'];
        
        // Obtener únicos de los pacientes actuales
        const pacientesOS = this.state.pacientes ? this.state.pacientes.map(p => p.obra_social).filter(Boolean) : [];
        const pacientesCirugias = this.state.pacientes ? this.state.pacientes.map(p => p.cirugia).filter(Boolean) : [];

        // Combinar defaults y pacientes
        const combinedOS = Array.from(new Set([...defaultOS, ...pacientesOS])).sort();
        const combinedCirugias = Array.from(new Set(pacientesCirugias)).sort();
        
        this.state.obrasSociales = combinedOS;
        this.state.cirugias = combinedCirugias;
        
        // Populate modal selects/datalists
        const osOptionsModal = this.state.obrasSociales.map(os => `<option value="${os}">${os}</option>`).join('');
        if(this.obraSocialSelect) {
            const currentVal = this.obraSocialSelect.value;
            this.obraSocialSelect.innerHTML = `<option value="">Seleccione...</option>${osOptionsModal}`;
            if(currentVal) this.obraSocialSelect.value = currentVal;
        }
        
        if(this.cirugiaList) this.cirugiaList.innerHTML = this.state.cirugias.map(c => `<option value="${c}">`).join('');
        
        // Populate filter selects
        const osOptions = this.state.obrasSociales.map(os => `<option value="${os}">${os}</option>`).join('');
        if(this.filterOs) this.filterOs.innerHTML = `<option value="">Todas las Obras Sociales</option>${osOptions}`;
        
        const cirugiaOptions = this.state.cirugias.map(c => `<option value="${c}">${c}</option>`).join('');
        if(this.filterCirugia) this.filterCirugia.innerHTML = `<option value="">Todas las Cirugías</option>${cirugiaOptions}`;
    },

    async loadPacientes() {
        this.showLoading(true);
        try {
            const filtros = {
                texto: this.searchInput ? this.searchInput.value.trim() : '',
                obra_social: this.filterOs ? this.filterOs.value : '',
                cirugia: this.filterCirugia ? this.filterCirugia.value : '',
                mes: this.filterMonth ? this.filterMonth.value : ''
            };
            
            const pacientes = await Pacientes.obtener(filtros);
            this.state.pacientes = pacientes;
            this.renderTable(pacientes);
            
            // Si el dashboard está activo, actualizarlo
            if(!this.dashboardView.classList.contains('hidden') && window.Dashboard) {
                window.Dashboard.update(pacientes);
            }
            
        } catch (error) {
            console.error('Error in loadPacientes:', error);
            this.showToast(`Error al cargar: ${error.message || error}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    renderTable(pacientes) {
        if(!this.tbody) return;
        this.tbody.innerHTML = '';
        if(this.cardsContainer) this.cardsContainer.innerHTML = '';
        
        if (pacientes.length === 0) {
            if(this.noResults) this.noResults.classList.remove('hidden');
            return;
        }
        
        if(this.noResults) this.noResults.classList.add('hidden');
        
        pacientes.forEach(p => {
            const dateParts = p.fecha ? p.fecha.split('-') : ['0000', '00', '00'];
            const formattedDate = p.fecha ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '-';
            const nombre = (p.nombre || '').trim();

            // ── Fila de tabla (desktop) ──────────────────────────
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td><strong>${nombre}</strong></td>
                <td class="hide-mobile">${p.dni || '-'}</td>
                <td><span class="badge badge-os">${p.obra_social || '-'}</span></td>
                <td><span class="badge badge-cirugia">${p.cirugia || '-'}</span></td>
                <td class="hide-mobile text-sm" style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.notas || ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline btn-edit" data-id="${p.id}">✏️</button>
                    <button class="btn btn-sm btn-outline btn-delete" data-id="${p.id}" style="color:#ef4444;border-color:#ef4444">🗑️</button>
                </td>
            `;
            this.tbody.appendChild(tr);

            // ── Card (móvil) ─────────────────────────────────────
            if(this.cardsContainer) {
                const card = document.createElement('div');
                card.className = 'patient-card';
                card.innerHTML = `
                    <div class="patient-card-header">
                        <div class="patient-card-name">${nombre}</div>
                        <div class="patient-card-date">${formattedDate}</div>
                    </div>
                    <div class="patient-card-badges">
                        <span class="badge badge-os">${p.obra_social || 'Sin OS'}</span>
                        <span class="badge badge-cirugia">${p.cirugia || '-'}</span>
                    </div>
                    ${p.notas ? `<div class="text-sm" style="color:var(--text-muted);font-size:0.8rem">${p.notas}</div>` : ''}
                    <div class="patient-card-actions">
                        <button class="btn btn-sm btn-outline btn-edit" data-id="${p.id}">✏️ Editar</button>
                        <button class="btn btn-sm btn-outline btn-delete" data-id="${p.id}" style="color:#ef4444;border-color:#ef4444">🗑️ Eliminar</button>
                    </div>
                `;
                this.cardsContainer.appendChild(card);
            }
        });
        
        // Bind edit/delete en tabla
        this.tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => this.editPaciente(e.currentTarget.dataset.id));
        });
        this.tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deletePaciente(e.currentTarget.dataset.id));
        });
        // Bind edit/delete en cards
        if(this.cardsContainer) {
            this.cardsContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => this.editPaciente(e.currentTarget.dataset.id));
            });
            this.cardsContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => this.deletePaciente(e.currentTarget.dataset.id));
            });
        }
    },

    openModal(paciente = null) {
        this.form.reset();
        document.getElementById('patient-id').value = '';
        
        if (paciente) {
            this.modalTitle.textContent = 'Editar Paciente';
            document.getElementById('patient-id').value = paciente.id;
            document.getElementById('fecha').value = paciente.fecha;
            document.getElementById('dni').value = paciente.dni || '';
            document.getElementById('nombre').value = paciente.nombre;
            document.getElementById('apellido').value = paciente.apellido || '';
            document.getElementById('obra_social').value = paciente.obra_social || '';
            document.getElementById('cirugia').value = paciente.cirugia;
            document.getElementById('notas').value = paciente.notas || '';
        } else {
            this.modalTitle.textContent = 'Nuevo Paciente';
            // Set today's date
            document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
        }
        
        this.modal.classList.remove('hidden');
    },

    editPaciente(id) {
        const paciente = this.state.pacientes.find(p => p.id === id);
        if (paciente) {
            this.openModal(paciente);
        }
    },

    async deletePaciente(id) {
        if (confirm('¿Estás segura de que quieres eliminar este registro quirúrgico?')) {
            try {
                await Pacientes.eliminar(id);
                this.showToast('Paciente eliminado');
                this.loadPacientes();
            } catch (error) {
                this.showToast('Error al eliminar', 'error');
            }
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const paciente = {
            id: document.getElementById('patient-id').value,
            fecha: document.getElementById('fecha').value,
            dni: document.getElementById('dni').value,
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            obra_social: document.getElementById('obra_social').value,
            cirugia: document.getElementById('cirugia').value,
            notas: document.getElementById('notas').value
        };
        
        try {
            this.form.querySelector('button[type="submit"]').disabled = true;
            
            await Pacientes.guardar(paciente);
            
            // Add to catalogs if new
            await Catalogos.registrarSiNoExiste('obra_social', paciente.obra_social);
            await Catalogos.registrarSiNoExiste('cirugia', paciente.cirugia);
            
            this.modal.classList.add('hidden');
            this.showToast('Registro guardado exitosamente');
            
            // Reload all
            await this.loadCatalogos();
            await this.loadPacientes();
            
        } catch (error) {
            console.error(error);
            this.showToast('Error al guardar el registro', 'error');
        } finally {
            this.form.querySelector('button[type="submit"]').disabled = false;
        }
    },

    populateMonthFilter() {
        if (!this.state.pacientes || this.state.pacientes.length === 0 || !this.filterMonth) return;
        
        const months = new Set();
        this.state.pacientes.forEach(p => {
            if (p.fecha) {
                months.add(p.fecha.substring(0, 7)); // YYYY-MM
            }
        });
        
        const sortedMonths = Array.from(months).sort().reverse();
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        let options = '<option value="">Todos los Meses</option>';
        sortedMonths.forEach(m => {
            const [year, month] = m.split('-');
            const name = `${monthNames[parseInt(month)-1]} ${year}`;
            options += `<option value="${m}">${name}</option>`;
        });
        
        const currentVal = this.filterMonth.value;
        this.filterMonth.innerHTML = options;
        if (currentVal && sortedMonths.includes(currentVal)) {
            this.filterMonth.value = currentVal;
        }
    },

    switchView(viewName) {
        if(viewName === 'pacientes') {
            this.mainView.classList.remove('hidden');
            this.dashboardView.classList.add('hidden');
            this.navPacientes.classList.add('active');
            this.navDashboard.classList.remove('active');
        } else if (viewName === 'dashboard') {
            this.mainView.classList.add('hidden');
            this.dashboardView.classList.remove('hidden');
            this.navPacientes.classList.remove('active');
            this.navDashboard.classList.add('active');
        }
    },

    showLoading(show) {
        if(!this.loading) return;
        if (show) {
            this.loading.classList.remove('hidden');
            if(this.tbody) this.tbody.innerHTML = '';
        } else {
            this.loading.classList.add('hidden');
        }
    },

    showToast(message, type = 'success') {
        if(!this.toast) return;
        this.toastMessage.textContent = message;
        this.toast.className = `toast toast-${type}`;
        this.toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.toast.classList.add('hidden');
        }, 3000);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
