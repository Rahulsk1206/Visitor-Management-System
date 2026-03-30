import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/visitors`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkInVisitor = (data) => API.post('', data);
export const getAllVisitors  = ()     => API.get('');
export const checkOutVisitor = (id)  => API.put(`/${id}/checkout`);
export const deleteVisitor  = (id)   => API.delete(`/${id}`);

export default API;
