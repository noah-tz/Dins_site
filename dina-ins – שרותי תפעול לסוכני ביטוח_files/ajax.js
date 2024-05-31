(function ($) {
  var cachedResponses = [],
      callsStack = [];

  $.RMP_AJAX = function (actionName, requestData, dontCache) {
    var actionMethod = 'POST',
        cachedData = {},
        cacheKey = generateCacheKey(actionMethod, actionName, requestData),
        ajaxConfig = {
          url: RMP_AJAX_LOCALS.ajaxUrl,
          type: actionMethod,
          data: _.extend({}, {
            action: 'RMP_' + actionName,
            _nonce: RMP_AJAX_LOCALS._nonce
          }, requestData)
        };

    if (isResponseCached(cacheKey) && !dontCache) {
      cachedData = cachedResponses[cacheKey];

      return $.Deferred()[cachedData['type']](cachedData['data']).promise();
    }

    return $.ajax(ajaxConfig).always(function(responseData, textStatus) {
      var cacheData = {
        'data': responseData,
        'type': 'resolve'
      };

      if (textStatus === 'error') {
        cacheData['type'] = 'reject';
      }

      return cacheResponse.apply(null, [cacheKey, cacheData]);
    });
  };

  function generateCacheKey(actionMethod, actionName, requestData) {
    return actionMethod + '_' + actionName + '_' + JSON.stringify(requestData);
  }

  function isResponseCached(cacheKey) {
    return ! _.isUndefined(cachedResponses[cacheKey]);
  }

  function cacheResponse(cacheKey, responseData) {
    if (! isResponseCached(cacheKey)) {
      cachedResponses[cacheKey] = responseData;
    }

    return responseData;
  }

})(jQuery);
