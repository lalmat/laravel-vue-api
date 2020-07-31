import Axios from 'axios';
Axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
Axios.defaults.headers.common['X-CSRF-TOKEN']     = document.head.querySelector('meta[name="csrf-token"]').content;

class APIObject {

  constructor(endpoint, options, timeout) {
    this.fetching   = false;
    this.endpoint   = endpoint;
    this.options    = options;
    this.timeout    = timeout;
    this.updated_at = null;
  }

  refresh_needed() {
    return (this.data == null ||
           this.updated_at == null ||
           (Date.now()+this.timeout) > this.updated_at);
  }

  async fetch() {
    this.fetching = true;
    this.data     = await API(this.endpoint).get(this.options);
    this.fetching = false;
    return this.data;
  }
}

function API(endpoint) {
  return new classApi(endpoint);
}

class classApi {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async all() {
    return await httpApi.fetch('GET', `/${this.endpoint}`);
  }

  async find(id) {
    return await httpApi.fetch('GET', `/${this.endpoint}/${id}`);
  }

  async save(data, id = null) {
    if (id == null || id == '') {
      return await this.create(data);
    } else {
      return await this.update(data, id);
    }
  }

  async create(data) {
    return await httpApi.fetch('POST', `/${this.endpoint}`, data);
  }

  async update(data, id) {
    return await httpApi.fetch('PATCH', `/${this.endpoint}/${id}`, data);
  }

  async delete(id) {
    return await httpApi.fetch('DELETE', `/${this.endpoint}/${id}`);
  }

  async post(query, data = null) {
    return await httpApi.fetch('POST', `/${this.endpoint}/${query}`, data);
  }

  async get(query) {
    return await httpApi.fetch('GET', `/${this.endpoint}/${query}`);
  }

  async ressource(verb, endpoint, data = null) {
    return await httpApi.fetch(verb, `/${endpoint}`, data);
  }

  async form(endpoint, formData) {
    return await httpApi.fetch('POST', `/${this.endpoint}/${endpoint}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }

  async upload(formData, uploadCallback) {
    return await httpApi.fetch('POST', `/${this.endpoint}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress:uploadCallback });
  }

  async download(endpoint, filename, data) {
    return await httpApi.download('POST', `/${this.endpoint}/${endpoint}`, filename, data);
  }
}

const httpApi = {

  /**
   * Axios Helper to send API requests
   *
   * Le but principal est d'obtenir directement les sets de resultats.
   * @param {string} method
   * @param {string} endpoint
   * @param {json} data
   */
  async fetch(method, endpoint, data=null, headers=null) {
    try {
      if (method == 'GET')    { let r = await Axios.get(endpoint); return r.data; }
      if (method == 'POST')   { let r = await Axios.post(endpoint, data, headers); return r.data; }
      if (method == 'PUT')    { let r = await Axios.patch(endpoint, data); return r.data; }
      if (method == 'PATCH')  { let r = await Axios.patch(endpoint, data); return r.data; }
      if (method == 'DELETE') { let r = await Axios.delete(endpoint); return r.data; }
      throw "Unkown Axios method";
    }
    catch (e) {
      console.log(e.response.status, e.response);
      if ([401, 419].includes(e.response.status)) {
        console.log('Reloading');
        window.location = '/login';
      }
      throw (e)
    }
  },

  download(method, url, filename, data=null) {
    Axios({
      url,
      method,
      data,
      responseType: 'blob',
      headers: {'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content}
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  }
}

export {
  API,
  APIObject
}
