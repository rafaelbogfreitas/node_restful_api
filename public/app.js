let app = {
  config: {
    sessionToken: false,
  },
  client: {
    request: (headers, path, method, queryStringObj, payload, callback) => {
      headers = typeof headers === "object" && headers !== null ? headers : {};
      path = typeof path === "string" ? path : "/";
      method = typeof method === "string" && ["GET", "POST", "PUT", "DELETE"].includes(method) ? method : "GET";
      queryStringObj = typeof queryStringObj === "object" && queryStringObj !== null ? queryStringObj : {};
      payload = typeof payload === "object" && payload !== null ? payload : {};
      callback = typeof callback === "function" ? callback : false;

      let requestUrl = `${path}?`;
      let counter = 0;

      for(key in queryStringObj) {
        counter++;
        requestUrl = `${requestUrl}${(counter > 1) && "="}${key}=${queryStringObj[key]}`;
      }

      const xhr = new XMLHttpRequest();
      xhr.open(method, requestUrl, true);
      xhr.setRequestHeader("Content-type", "application/json");
      
      for(key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }
      
      if(app.config.sessionToken) {
        xhr.setRequestHeader("token", app.config.sessionToken.id);
      }

      xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE) {
          const statusCode = xhr.status;
          const response = xhr.responseText;

          if(callback) {
            try {
              const parsedResponse = JSON.parse(response);
              callback(statusCode, parsedResponse);
            } catch(e) {
              callback(statusCode, false);
            }
          }
        }
      }

      const payloadString = JSON.stringify(payload);

      xhr.send(payloadString);
    },
  }
};

console.log("Hello World!");