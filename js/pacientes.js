const Pacientes = {
    async obtener(filtros = {}) {
        let query = supabaseClient
            .from('pacientes')
            .select('*')
            .order('fecha', { ascending: false });
            
        if (filtros.texto) {
            query = query.or(`nombre.ilike.%${filtros.texto}%`);
        }

        if (filtros.obra_social) query = query.ilike('obra_social', `%${filtros.obra_social.trim()}%`);
        if (filtros.cirugia) query = query.ilike('cirugia', `%${filtros.cirugia.trim()}%`);
        if (filtros.mes) {
            const [year, month] = filtros.mes.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];
            query = query.gte('fecha', startDate).lte('fecha', endDate);
        }
        
        const { data, error } = await query;
        if (error) {
            console.error('Error al obtener pacientes:', error);
            throw error;
        }
        return data;
    },
    
    async guardar(paciente) {
        const { data: userData } = await supabaseClient.auth.getUser();
        if (!userData || !userData.user) throw new Error('Usuario no autenticado');

        const dataToSave = {
            fecha: paciente.fecha,
            nombre: paciente.nombre,
            dni: paciente.dni || null,
            obra_social: paciente.obra_social,
            cirugia: paciente.cirugia,
            notas: paciente.notas || null,
            user_id: userData.user.id
        };

        if (paciente.id) {
            // Update
            dataToSave.updated_at = new Date().toISOString();
            const { data, error } = await supabaseClient
                .from('pacientes')
                .update(dataToSave)
                .eq('id', paciente.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            // Insert
            const { data, error } = await supabaseClient
                .from('pacientes')
                .insert([dataToSave])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },
    
    async eliminar(id) {
        const { error } = await supabaseClient
            .from('pacientes')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
