jQuery(window).on('elementor/frontend/init', function () {
  var $ = jQuery,
      formWidgetSelector = '.responder-form-main-wrapper form';

  if (elementorFrontend.isEditMode()) {
    return false;
  }

  $(document).on('submit', formWidgetSelector, onFormSubmit);

  function onFormSubmit(event) {
    var $currentForm = $(event.currentTarget);

    beforeSubmit($currentForm);

    if (validateForm($currentForm)) {
      $.RMP_AJAX('submitElementorForm', getFormData($currentForm), true)
        .done(function (response) {
          onFormSent($currentForm)
        })
        .fail(function () {
          onFormFailure($currentForm);
        })
        .always(function () {
          afterSubmit($currentForm);
        });
    } else {
      afterSubmit($currentForm);
    }

    event.preventDefault();
  }

  function getFormData($form) {
    var formData = {
      fields: $form.serializeArray(),
      uriFields: [],
      form_id: $form.data('form_id')
    };

    // Serialize bool unchecked checkboxes
    $form
      .find('[data-field-type="bool"] input[type="checkbox"]:not(:checked)')
      .each(function (index, element) {
        formData['fields'].push({ name: element.getAttribute('name'), value: 'off' });
      });

    // Set URI params and remove []
    _.each(formData.fields, function (field) {
      formData.uriFields.push({
        name:  $form.find('[name="' + field.name + '"]').data('uri_param'),
        value: field.value
      });
    });

    return formData;
  }

  function onFormSent($form, response) {
    var actionAfterSubmit = $form.data('action_after_submit'),
        urlThankYou       = $form.data('urlthankyou'),
        openNew           = $form.data('urlthankyou-opennew') === 'yes',
        addParams         = $form.data('urlthankyou-addparams') === 'yes',
        searchQuery       = $.param(getFormData($form).uriFields),
        querySeparator    = '?';

    $form
      .find('.fields-wrapper').hide().end()
      .find('.responder-message-sent').show().end();

    if (actionAfterSubmit === 'redirect_to_thankyou_page') {
      if (addParams) {
        if (urlThankYou.indexOf(querySeparator) !== -1) {
          querySeparator = '&';
        }

        urlThankYou = encodeURI(urlThankYou + querySeparator + searchQuery);
      }

      if (openNew) {
        window.open(urlThankYou)
      } else {
        window.location.href = urlThankYou;
      }
    }
  }

  function onFormFailure($form) {
    showErrorMessages($form, [
      getErrorMessage('server_error')
    ]);
  }

  function beforeSubmit($form) {
    var $errorMessages = $form.find('.responder-message-form-error'),
      $submitButton = $form.find('.res-button-submit');

    $errorMessages.empty().hide();
    $submitButton
      .attr('disabled', true)
      .val($submitButton.data('submitting_text'));
  }

  function afterSubmit($form) {
    var $submitButton = $form.find('.res-button-submit');

    $submitButton
      .val($submitButton.data('original_text'))
      .attr('disabled', false);
  }

  function validateForm($form) {
    var $fields = $form.find('.res-form-field-input'),
      errorMessages = [],
      isFormValid = true;

    _.each($fields, function (field) {
      var $field = $(field),
          errorMessage = validateField($field);

      if (errorMessage.length) {
        errorMessages.push(errorMessage);
      }
    });

    if (errorMessages.length) {
      showErrorMessages($form, errorMessages);
      isFormValid = false;
    }

    return isFormValid;
  }

  function validateField($field) {
    var fieldType    = $field.data('field-type'),
        fieldLabel   = $field.find('.elementor-field-label').text().trim(),
        $fieldInputs = $field.find('input, select, textarea'),
        errorMessage = '',
        regexFilter  = '';

    switch (fieldType) {
      case 'number':
        regexFilter = /^-?\d+$/;

        if (!validateFieldIfRequired($fieldInputs, fieldType)) {
          errorMessage = getErrorMessage('required', fieldLabel);
        } else if (!validateFieldByFilter($fieldInputs, regexFilter)) {
          errorMessage = getErrorMessage('invalid_number');
        }
        break;

      case 'date':
        regexFilter = /^\d{4}[./-]\d{2}[./-]\d{2}$/;

        if (!validateFieldIfRequired($fieldInputs, fieldType)) {
          errorMessage = getErrorMessage('required', fieldLabel);
        } else if (!validateFieldByFilter($fieldInputs, regexFilter)) {
          errorMessage = getErrorMessage('invalid_date');
        }
        break;

      case 'phone':
        regexFilter = /^(?:050|051|052|053|054|055|057|058|02|03|04|08|09)\d{7}$/;

        if (!validateFieldIfRequired($fieldInputs, fieldType)) {
          errorMessage = getErrorMessage('required', fieldLabel);
        } else if (!validateFieldByFilter($fieldInputs, regexFilter)) {
          errorMessage = getErrorMessage('invalid_phone');
        }
        break;

      case 'email':
        regexFilter = /\S+@\S+\.\S+/;

        if (!validateFieldIfRequired($fieldInputs, fieldType)) {
          errorMessage = getErrorMessage('required', fieldLabel);
        } else if (!validateFieldByFilter($fieldInputs, regexFilter)) {
          errorMessage = getErrorMessage('invalid_email');
        }
        break;

      default:
        if (!validateFieldIfRequired($fieldInputs, fieldType)) {
          errorMessage = getErrorMessage('required', fieldLabel);
        }
    }

    return errorMessage;
  }

  function validateFieldByFilter($fieldInputs, filter) {
    var value = $fieldInputs.val().trim();

    if (!value.length) {
      return true;
    }

    return filter.test(value);
  }

  function validateFieldIfRequired($fieldInputs, fieldType) {
    var isRequired = $fieldInputs.parents('.res-form-field').hasClass('elementor-mark-required');

    if (!isRequired) {
      return true;
    }

    switch(fieldType) {
      case 'multichoice':
      case 'bool':
        isRequired = $fieldInputs.is(':checked');
        break;
      default:
        isRequired = $fieldInputs.val().trim().length;
    }

    return isRequired;
  }

  function getErrorMessage(errorType, fieldLabel) {
    var formErrors = $(formWidgetSelector).data('form_errors'),
        message = '';

    fieldLabel = fieldLabel || '';

    if (errorType in formErrors) {
      message = formErrors[errorType] + ' <strong>' + fieldLabel + '</strong>';
    }

    return message;
  }

  function showErrorMessages($form, messages) {
    var errorsBoxSelector = '.responder-message-form-error',
        errorMessagesHtml = [];

    _.each(messages, function(message) {
      errorMessagesHtml.push(message + '<br/>');
    });

    $form.find(errorsBoxSelector)
      .append(errorMessagesHtml)
      .show();
  }

});
