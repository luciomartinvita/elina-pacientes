const Catalogos = {
    async obtenerTodos() {
        const { data, error } = await supabaseClient
            .from('catalogos')
            .select('*')
            .order('valor');
            
        if (error) {
            console.error('Error al obtener catálogos:', error);
            return { obrasSociales: [], cirugias: [] };
        }
        
        return {
            obrasSociales: data.filter(c => c.tipo === 'obra_social').map(c => c.valor),
            cirugias: data.filter(c => c.tipo === 'cirugia').map(c => c.valor)
        };
    },
    
    async registrarSiNoExiste(tipo, valor) {
        if (!valor) return;
        
        const { data, error } = await supabaseClient
            .from('catalogos')
            .select('id')
            .eq('tipo', tipo)
            .ilike('valor', valor)
            .maybeSingle();
            
        if (!data && !error) {
            await supabaseClient.from('catalogos').insert([{ tipo, valor }]);
        }
    }
};
