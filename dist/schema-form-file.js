/**
 * angular-schema-form-nwp-file-upload - Upload file type for Angular Schema Form
 * @version v0.1.5
 * @link https://github.com/saburab/angular-schema-form-nwp-file-upload
 * @license MIT
 */
'use strict';

angular
  .module('schemaForm')
  .config(['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
    function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
      var defaultPatternMsg  = 'Wrong file type. Allowed types are ',
          defaultMaxSizeMsg1 = 'This file is too large. Maximum size allowed is ',
          defaultMaxSizeMsg2 = 'Current file size:',
          defaultMinItemsMsg = 'You have to upload at least one file',
          defaultMaxItemsMsg = 'You can\'t upload more than one file.';

      var nwpSinglefileUpload = function (name, schema, options) {
        if (schema.type === 'array' && schema.format === 'singlefile') {
          if (schema.pattern && schema.pattern.mimeType && !schema.pattern.validationMessage) {
            schema.pattern.validationMessage = defaultPatternMsg;
          }
          if (schema.maxSize && schema.maxSize.maximum && !schema.maxSize.validationMessage) {
            schema.maxSize.validationMessage  = defaultMaxSizeMsg1;
            schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
          }
          if (schema.minItems && !schema.minItemsValidationMessage) {
            schema.minItemsValidationMessage = defaultMinItemsMsg;
          }
          if (schema.maxItems && !schema.maxItemsValidationMessage) {
            schema.maxItemsValidationMessage = defaultMaxItemsMsg;
          }

          var f                                                  = schemaFormProvider.stdFormObj(name, schema, options);
          f.key                                                  = options.path;
          f.type                                                 = 'nwpFileUpload';
          options.lookup[sfPathProvider.stringify(options.path)] = f;
          return f;
        }
      };

      schemaFormProvider.defaults.array.unshift(nwpSinglefileUpload);

      var nwpMultifileUpload = function (name, schema, options) {
        if (schema.type === 'array' && schema.format === 'multifile') {
          if (schema.pattern && schema.pattern.mimeType && !schema.pattern.validationMessage) {
            schema.pattern.validationMessage = defaultPatternMsg;
          }
          if (schema.maxSize && schema.maxSize.maximum && !schema.maxSize.validationMessage) {
            schema.maxSize.validationMessage  = defaultMaxSizeMsg1;
            schema.maxSize.validationMessage2 = defaultMaxSizeMsg2;
          }
          if (schema.minItems && !schema.minItemsValidationMessage) {
            schema.minItemsValidationMessage = defaultMinItemsMsg;
          }
          if (schema.maxItems && !schema.maxItemsValidationMessage) {
            schema.maxItemsValidationMessage = defaultMaxItemsMsg;
          }

          var f                                                  = schemaFormProvider.stdFormObj(name, schema, options);
          f.key                                                  = options.path;
          f.type                                                 = 'nwpFileUpload';
          options.lookup[sfPathProvider.stringify(options.path)] = f;
          return f;
        }
      };

      schemaFormProvider.defaults.array.unshift(nwpMultifileUpload);

      schemaFormDecoratorsProvider.addMapping(
        'bootstrapDecorator',
        'nwpFileUpload',
        'directives/decorators/bootstrap/nwp-file/nwp-file.html'
      );
    }
  ]);

angular.module('schemaForm').directive(
  'ngFileCountValidator', [
    function() {
      return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
          var valid = scope.form.schema.maxItems ? (scope.model.images ? scope.model.images.length : 0) < scope.form.schema.maxItems : true;
          ngModel.$parsers.unshift(function(value) {
            ngModel.$setValidity('ngFileCountValidator', valid);
            return valid ? value : undefined;
          });

          ngModel.$formatters.unshift(function(value) {
            ngModel.$setValidity('ngFileCountValidator', valid);
            return valid ? value : undefined;
          });
        }
      }
    }
  ]
);

angular
   .module('ngSchemaFormFile', [
      'ngFileUpload',
      'ngMessages'
   ])
   .directive('ngSchemaFile', ['Upload', 'CookieService', '$timeout', '$q', function (Upload, CookieService, $timeout, $q) {
      return {
        restrict: 'A',
        scope:    true,
        require:  'ngModel',
        link:     function (scope, element, attrs, ngModel) {
          scope.url = scope.form && scope.form.endpoint;
          var token = CookieService.getToken();
          scope.isSinglefileUpload = scope.form && scope.form.schema && scope.form.schema.format === 'singlefile';

          scope.selectFile  = function (file) {
            scope.picFile = file;
          };
          scope.selectFiles = function (files) {
            scope.picFiles = files;
          };

          scope.uploadFile = function (file, schemaId) {
            file && doUpload(file, token, schemaId);
          };

          scope.uploadFiles = function (files, schemaId) {
            files.length && angular.forEach(files, function (file) {
              doUpload(file, token, schemaId);
            });
          };

          function doUpload(file, token, schemaId) {
            if ((scope.model.images ? scope.model.images.length : 0) + 1 > scope.form.schema.maxItems) {
              scope.uploadForm.$error.maxItems = true;
              file.$error = "maxItems";
              file.$errorParam = (scope.model.images ? scope.model.images.length : 0) + 1 + ". Datei, " + scope.form.schema.maxItems + " Dateien erlaubt.";
            }
            if (file && !file.$error && scope.url) {
              file.upload = Upload.upload({
                url:  scope.url,
                file: file,
                data: {
                  schemaId: schemaId,
                  path: scope.form.path
                },
                headers: {'X-Archibald-Token': token}
              });

              file.upload.then(function (response) {
                $timeout(function () {
                  file.result = response.data;
                });
                // first file on that property in record
                if (!ngModel.$viewValue) {
                  ngModel.$setViewValue([response.data]);
                // property already has files
                } else {
                  var found = false;
                  ngModel.$viewValue.forEach(function (file) {
                    if (file.filename == response.data.filename) { found = true; }
                  });
                  if (!found) {
                    ngModel.$viewValue.push(response.data);
                  }
                }
                ngModel.$commitViewValue();
                // empties fileinput for one file after being uploaded, timeout
                // to wait for progressbar to change before removing file through
                // animation from the filepicker
                $timeout(function () {
                  scope.picFiles.forEach(function (picFile) {
                    if (file.blobUrl == picFile.blobUrl) {
                      scope.picFiles.splice(scope.picFiles.indexOf(picFile),1);
                    }
                    scope.uploadForm.$setDirty();
                  });
                });
              }, function (response) {
                if (response.status > 0) {
                  scope.errorMsg = response.status + ': ' + response.data;
                }
              });

              file.upload.progress(function (evt) {
                file.progress = Math.min(100, parseInt(100.0 *
                  evt.loaded / evt.total));
              });
            }
          }

          // deletes a file from a record, the file and it's database entry are left
          // since that scenario is assumed to be unlikely and better dealt with in
          // future as of now
          scope.deleteFile = function (filename) {
            var files = [];
            ngModel.$viewValue.forEach(function (file) {
              if (file != filename) {
                files.push(file);
              }
            });
            ngModel.$setViewValue(files);
            if (scope.picFiles) {
              scope.picFiles.forEach(function (picFile) {
                if (picFile.$error == "maxItems") {
                  delete picFile.$error;
                  delete picFile.$errorParam;
                }
              });
            }
          }
        }
      };
  }]);

angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/nwp-file/nwp-file.html","<ng-form sf-array=\"form\" class=\"file-upload mb-lg\" ng-schema-file ng-file-count-validator ng-model=\"$$value$$\" name=\"uploadForm\">\n  <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\n    {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\n  </label>\n\n  <div ng-repeat=\"file in $$value$$\">\n    <div class=\"thumbnail-container\">\n      <label><a href=\"api/files/download/{{file.filename}}/{{schema.id}}/{{file.path}}\" download=\"{{file.originalname}}\">{{file.originalname}}</a></label>\n      <!-- api call to get file preview from server -->\n      <img ng-src=\"/api/files/preview/{{file.filename}}/{{schema.id}}/{{file.path}}\" class=\"file-thumbnail\">\n      <button class=\"btn btn-danger btn-xs\" ng-click=\"deleteFile(file)\">x</button>\n    </div>\n  </div>\n  <div class=\"clearfix\"></div>\n\n  <div ng-show=\"picFile\">\n    <div ng-include=\"\'uploadProcess.html\'\" class=\"mb\"></div>\n  </div>\n\n  <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group process-files\">\n    <li class=\"list-group-item process-file\" ng-repeat=\"picFile in picFiles\">\n      <div ng-include=\"\'uploadProcess.html\'\"></div>\n    </li>\n  </ul>\n\n  <div class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n    <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\n    <div ng-if=\"isSinglefileUpload\" ng-include=\"\'singleFileUpload.html\'\"></div>\n    <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'multiFileUpload.html\'\"></div>\n    <div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>\n    <div class=\"help-block mb0\" ng-show=\"(hasError() && errorMessage(schemaError()))\" ng-bind-html=\"(hasError() && errorMessage(schemaError()))\"></div>\n  </div>\n</ng-form>\n\n<script type=\'text/ng-template\' id=\"uploadProcess.html\">\n  <div class=\"row mb\">\n    <div class=\"col-sm-4 mb-sm\">\n      <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.preview\' | translate }}</label>\n      <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\n      <div class=\"img-placeholder\"\n          ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">Keine Vorschau verfügbar\n      </div>\n    </div>\n    <div class=\"col-sm-4 mb-sm\">\n      <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.filename\' | translate }}</label>\n      <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\n    </div>\n    <div class=\"col-sm-4 mb-sm\">\n      <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.progress\' | translate }}</label>\n      <div class=\"progress\">\n        <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\n            ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\n            ng-style=\"{width: picFile.progress + \'%\'}\">\n          {{ picFile.progress }} %\n        </div>\n      </div>\n      <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile, schema.id)\"\n              ng-disabled=\"!picFile || picFile.$error\">{{ \"buttons.upload\" | translate }}\n      </button>\n    </div>\n  </div>\n  <div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\n    <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong>. ({{ form.schema[picFile.$error].validationMessage2 | translate }} <strong>{{picFile.size / 1000000|number:1}}MB</strong>)</div>\n    <div class=\"text-danger errorMsg\" ng-message=\"pattern\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n    <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ form.schema[picFile.$error + \"ValidationMessage\"] | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n    <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ form.schema[picFile.$error + \"ValidationMessage\"] | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n    <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{errorMsg}}</div>\n  </div>\n</script>\n\n<script type=\'text/ng-template\' id=\"singleFileUpload.html\">\n  <div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\n      ng-model=\"picFile\" name=\"file\"\n      ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n      ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n      ng-required=\"form.required\"\n      accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n      ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n    <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\n  </div>\n  <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n  <button ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\n    ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n    ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n    class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n  </button>\n</script>\n\n<script type=\'text/ng-template\' id=\"multiFileUpload.html\">\n  <div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\n    ng-model=\"picFiles\" name=\"files\"\n    ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"*\"\n    ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n    <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\n  </div>\n  <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n  <button ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\n    accept=\"*\"\n    ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n    ng-required=\"form.required\"\n    ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n    class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n     <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n     {{ \"buttons.add\" | translate }}\n  </button>\n</script>\n");}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzhFQ2pOQSIsImZpbGUiOiJzY2hlbWEtZm9ybS1maWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5hbmd1bGFyXG4gIC5tb2R1bGUoJ3NjaGVtYUZvcm0nKVxuICAuY29uZmlnKFsnc2NoZW1hRm9ybVByb3ZpZGVyJywgJ3NjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXInLCAnc2ZQYXRoUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChzY2hlbWFGb3JtUHJvdmlkZXIsIHNjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXIsIHNmUGF0aFByb3ZpZGVyKSB7XG4gICAgICB2YXIgZGVmYXVsdFBhdHRlcm5Nc2cgID0gJ1dyb25nIGZpbGUgdHlwZS4gQWxsb3dlZCB0eXBlcyBhcmUgJyxcbiAgICAgICAgICBkZWZhdWx0TWF4U2l6ZU1zZzEgPSAnVGhpcyBmaWxlIGlzIHRvbyBsYXJnZS4gTWF4aW11bSBzaXplIGFsbG93ZWQgaXMgJyxcbiAgICAgICAgICBkZWZhdWx0TWF4U2l6ZU1zZzIgPSAnQ3VycmVudCBmaWxlIHNpemU6JyxcbiAgICAgICAgICBkZWZhdWx0TWluSXRlbXNNc2cgPSAnWW91IGhhdmUgdG8gdXBsb2FkIGF0IGxlYXN0IG9uZSBmaWxlJyxcbiAgICAgICAgICBkZWZhdWx0TWF4SXRlbXNNc2cgPSAnWW91IGNhblxcJ3QgdXBsb2FkIG1vcmUgdGhhbiBvbmUgZmlsZS4nO1xuXG4gICAgICB2YXIgbndwU2luZ2xlZmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHNjaGVtYS50eXBlID09PSAnYXJyYXknICYmIHNjaGVtYS5mb3JtYXQgPT09ICdzaW5nbGVmaWxlJykge1xuICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdFBhdHRlcm5Nc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4U2l6ZSAmJiBzY2hlbWEubWF4U2l6ZS5tYXhpbXVtICYmICFzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UgID0gZGVmYXVsdE1heFNpemVNc2cxO1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmICFzY2hlbWEubWluSXRlbXNWYWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zVmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgIXNjaGVtYS5tYXhJdGVtc1ZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICBzY2hlbWEubWF4SXRlbXNWYWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwU2luZ2xlZmlsZVVwbG9hZCk7XG5cbiAgICAgIHZhciBud3BNdWx0aWZpbGVVcGxvYWQgPSBmdW5jdGlvbiAobmFtZSwgc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gJ2FycmF5JyAmJiBzY2hlbWEuZm9ybWF0ID09PSAnbXVsdGlmaWxlJykge1xuICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdFBhdHRlcm5Nc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4U2l6ZSAmJiBzY2hlbWEubWF4U2l6ZS5tYXhpbXVtICYmICFzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UgID0gZGVmYXVsdE1heFNpemVNc2cxO1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmICFzY2hlbWEubWluSXRlbXNWYWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zVmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgIXNjaGVtYS5tYXhJdGVtc1ZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICBzY2hlbWEubWF4SXRlbXNWYWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwTXVsdGlmaWxlVXBsb2FkKTtcblxuICAgICAgc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlci5hZGRNYXBwaW5nKFxuICAgICAgICAnYm9vdHN0cmFwRGVjb3JhdG9yJyxcbiAgICAgICAgJ253cEZpbGVVcGxvYWQnLFxuICAgICAgICAnZGlyZWN0aXZlcy9kZWNvcmF0b3JzL2Jvb3RzdHJhcC9ud3AtZmlsZS9ud3AtZmlsZS5odG1sJ1xuICAgICAgKTtcbiAgICB9XG4gIF0pO1xuXG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hRm9ybScpLmRpcmVjdGl2ZShcbiAgJ25nRmlsZUNvdW50VmFsaWRhdG9yJywgW1xuICAgIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcbiAgICAgICAgICB2YXIgdmFsaWQgPSBzY29wZS5mb3JtLnNjaGVtYS5tYXhJdGVtcyA/IChzY29wZS5tb2RlbC5pbWFnZXMgPyBzY29wZS5tb2RlbC5pbWFnZXMubGVuZ3RoIDogMCkgPCBzY29wZS5mb3JtLnNjaGVtYS5tYXhJdGVtcyA6IHRydWU7XG4gICAgICAgICAgbmdNb2RlbC4kcGFyc2Vycy51bnNoaWZ0KGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBuZ01vZGVsLiRzZXRWYWxpZGl0eSgnbmdGaWxlQ291bnRWYWxpZGF0b3InLCB2YWxpZCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsaWQgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG5nTW9kZWwuJGZvcm1hdHRlcnMudW5zaGlmdChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgbmdNb2RlbC4kc2V0VmFsaWRpdHkoJ25nRmlsZUNvdW50VmFsaWRhdG9yJywgdmFsaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbGlkID8gdmFsdWUgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIF1cbik7XG5cbmFuZ3VsYXJcbiAgIC5tb2R1bGUoJ25nU2NoZW1hRm9ybUZpbGUnLCBbXG4gICAgICAnbmdGaWxlVXBsb2FkJyxcbiAgICAgICduZ01lc3NhZ2VzJ1xuICAgXSlcbiAgIC5kaXJlY3RpdmUoJ25nU2NoZW1hRmlsZScsIFsnVXBsb2FkJywgJ0Nvb2tpZVNlcnZpY2UnLCAnJHRpbWVvdXQnLCAnJHEnLCBmdW5jdGlvbiAoVXBsb2FkLCBDb29raWVTZXJ2aWNlLCAkdGltZW91dCwgJHEpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiAgICB0cnVlLFxuICAgICAgICByZXF1aXJlOiAgJ25nTW9kZWwnLFxuICAgICAgICBsaW5rOiAgICAgZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbCkge1xuICAgICAgICAgIHNjb3BlLnVybCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5lbmRwb2ludDtcbiAgICAgICAgICB2YXIgdG9rZW4gPSBDb29raWVTZXJ2aWNlLmdldFRva2VuKCk7XG4gICAgICAgICAgc2NvcGUuaXNTaW5nbGVmaWxlVXBsb2FkID0gc2NvcGUuZm9ybSAmJiBzY29wZS5mb3JtLnNjaGVtYSAmJiBzY29wZS5mb3JtLnNjaGVtYS5mb3JtYXQgPT09ICdzaW5nbGVmaWxlJztcblxuICAgICAgICAgIHNjb3BlLnNlbGVjdEZpbGUgID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgIHNjb3BlLnBpY0ZpbGUgPSBmaWxlO1xuICAgICAgICAgIH07XG4gICAgICAgICAgc2NvcGUuc2VsZWN0RmlsZXMgPSBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgICAgIHNjb3BlLnBpY0ZpbGVzID0gZmlsZXM7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGUgPSBmdW5jdGlvbiAoZmlsZSwgc2NoZW1hSWQpIHtcbiAgICAgICAgICAgIGZpbGUgJiYgZG9VcGxvYWQoZmlsZSwgdG9rZW4sIHNjaGVtYUlkKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgc2NvcGUudXBsb2FkRmlsZXMgPSBmdW5jdGlvbiAoZmlsZXMsIHNjaGVtYUlkKSB7XG4gICAgICAgICAgICBmaWxlcy5sZW5ndGggJiYgYW5ndWxhci5mb3JFYWNoKGZpbGVzLCBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICBkb1VwbG9hZChmaWxlLCB0b2tlbiwgc2NoZW1hSWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGZ1bmN0aW9uIGRvVXBsb2FkKGZpbGUsIHRva2VuLCBzY2hlbWFJZCkge1xuICAgICAgICAgICAgaWYgKChzY29wZS5tb2RlbC5pbWFnZXMgPyBzY29wZS5tb2RlbC5pbWFnZXMubGVuZ3RoIDogMCkgKyAxID4gc2NvcGUuZm9ybS5zY2hlbWEubWF4SXRlbXMpIHtcbiAgICAgICAgICAgICAgc2NvcGUudXBsb2FkRm9ybS4kZXJyb3IubWF4SXRlbXMgPSB0cnVlO1xuICAgICAgICAgICAgICBmaWxlLiRlcnJvciA9IFwibWF4SXRlbXNcIjtcbiAgICAgICAgICAgICAgZmlsZS4kZXJyb3JQYXJhbSA9IChzY29wZS5tb2RlbC5pbWFnZXMgPyBzY29wZS5tb2RlbC5pbWFnZXMubGVuZ3RoIDogMCkgKyAxICsgXCIuIERhdGVpLCBcIiArIHNjb3BlLmZvcm0uc2NoZW1hLm1heEl0ZW1zICsgXCIgRGF0ZWllbiBlcmxhdWJ0LlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbGUgJiYgIWZpbGUuJGVycm9yICYmIHNjb3BlLnVybCkge1xuICAgICAgICAgICAgICBmaWxlLnVwbG9hZCA9IFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgICAgICAgIHVybDogIHNjb3BlLnVybCxcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgIHNjaGVtYUlkOiBzY2hlbWFJZCxcbiAgICAgICAgICAgICAgICAgIHBhdGg6IHNjb3BlLmZvcm0ucGF0aFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydYLUFyY2hpYmFsZC1Ub2tlbic6IHRva2VufVxuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICBmaWxlLnVwbG9hZC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIGZpbGUucmVzdWx0ID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBmaXJzdCBmaWxlIG9uIHRoYXQgcHJvcGVydHkgaW4gcmVjb3JkXG4gICAgICAgICAgICAgICAgaWYgKCFuZ01vZGVsLiR2aWV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZShbcmVzcG9uc2UuZGF0YV0pO1xuICAgICAgICAgICAgICAgIC8vIHByb3BlcnR5IGFscmVhZHkgaGFzIGZpbGVzXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgbmdNb2RlbC4kdmlld1ZhbHVlLmZvckVhY2goZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUuZmlsZW5hbWUgPT0gcmVzcG9uc2UuZGF0YS5maWxlbmFtZSkgeyBmb3VuZCA9IHRydWU7IH1cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBuZ01vZGVsLiR2aWV3VmFsdWUucHVzaChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmdNb2RlbC4kY29tbWl0Vmlld1ZhbHVlKCk7XG4gICAgICAgICAgICAgICAgLy8gZW1wdGllcyBmaWxlaW5wdXQgZm9yIG9uZSBmaWxlIGFmdGVyIGJlaW5nIHVwbG9hZGVkLCB0aW1lb3V0XG4gICAgICAgICAgICAgICAgLy8gdG8gd2FpdCBmb3IgcHJvZ3Jlc3NiYXIgdG8gY2hhbmdlIGJlZm9yZSByZW1vdmluZyBmaWxlIHRocm91Z2hcbiAgICAgICAgICAgICAgICAvLyBhbmltYXRpb24gZnJvbSB0aGUgZmlsZXBpY2tlclxuICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgIHNjb3BlLnBpY0ZpbGVzLmZvckVhY2goZnVuY3Rpb24gKHBpY0ZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUuYmxvYlVybCA9PSBwaWNGaWxlLmJsb2JVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzY29wZS5waWNGaWxlcy5zcGxpY2Uoc2NvcGUucGljRmlsZXMuaW5kZXhPZihwaWNGaWxlKSwxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzY29wZS51cGxvYWRGb3JtLiRzZXREaXJ0eSgpO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPiAwKSB7XG4gICAgICAgICAgICAgICAgICBzY29wZS5lcnJvck1zZyA9IHJlc3BvbnNlLnN0YXR1cyArICc6ICcgKyByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgZmlsZS51cGxvYWQucHJvZ3Jlc3MoZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSBNYXRoLm1pbigxMDAsIHBhcnNlSW50KDEwMC4wICpcbiAgICAgICAgICAgICAgICAgIGV2dC5sb2FkZWQgLyBldnQudG90YWwpKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gZGVsZXRlcyBhIGZpbGUgZnJvbSBhIHJlY29yZCwgdGhlIGZpbGUgYW5kIGl0J3MgZGF0YWJhc2UgZW50cnkgYXJlIGxlZnRcbiAgICAgICAgICAvLyBzaW5jZSB0aGF0IHNjZW5hcmlvIGlzIGFzc3VtZWQgdG8gYmUgdW5saWtlbHkgYW5kIGJldHRlciBkZWFsdCB3aXRoIGluXG4gICAgICAgICAgLy8gZnV0dXJlIGFzIG9mIG5vd1xuICAgICAgICAgIHNjb3BlLmRlbGV0ZUZpbGUgPSBmdW5jdGlvbiAoZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHZhciBmaWxlcyA9IFtdO1xuICAgICAgICAgICAgbmdNb2RlbC4kdmlld1ZhbHVlLmZvckVhY2goZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgaWYgKGZpbGUgIT0gZmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgICBmaWxlcy5wdXNoKGZpbGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZShmaWxlcyk7XG4gICAgICAgICAgICBpZiAoc2NvcGUucGljRmlsZXMpIHtcbiAgICAgICAgICAgICAgc2NvcGUucGljRmlsZXMuZm9yRWFjaChmdW5jdGlvbiAocGljRmlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChwaWNGaWxlLiRlcnJvciA9PSBcIm1heEl0ZW1zXCIpIHtcbiAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwaWNGaWxlLiRlcnJvcjtcbiAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwaWNGaWxlLiRlcnJvclBhcmFtO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICB9XSk7XG4iLG51bGxdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
