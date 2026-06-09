let webhookUrl = process.env.REACT_APP_GOOGLE_SHEETS_WEBHOOK_URL || localStorage.getItem('google_sheets_webhook_url') || '';

export const setWebhookUrl = (url) => {
    webhookUrl = url;
    if (url) {
        localStorage.setItem('google_sheets_webhook_url', url);
    } else {
        localStorage.removeItem('google_sheets_webhook_url');
    }
};

export const getWebhookUrl = () => {
    return webhookUrl;
};

const callWebhook = async (action, payload = {}) => {
    if (!webhookUrl) {
        throw new Error('URL de Google Sheets no configurada');
    }
    
    const body = {
        action,
        ...payload
    };
    
    // Evitamos enviar Content-Type: application/json para prevenir preflight OPTIONS CORS de Apps Script
    const response = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.statusText}`);
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Ocurrió un error en la operación.');
    }
    
    return result.data;
};

export const googleSheetsClient = {
    checkConfig: async () => {
        return callWebhook('checkConfig');
    },
    setPassword: async (hash) => {
        return callWebhook('setPassword', { hash });
    },
    getDatos: async () => {
        return callWebhook('getDatos');
    },
    agregarGasto: async (gasto) => {
        return callWebhook('agregarGasto', { gasto });
    },
    eliminarGasto: async (id, propiedadId) => {
        return callWebhook('eliminarGasto', { id, propiedad_id: propiedadId });
    },
    agregarPropiedad: async (propiedad) => {
        return callWebhook('agregarPropiedad', { propiedad });
    },
    eliminarPropiedad: async (id, nombre) => {
        return callWebhook('eliminarPropiedad', { id, nombre });
    }
};
