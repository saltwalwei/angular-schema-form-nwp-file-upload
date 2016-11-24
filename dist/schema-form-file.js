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
   .directive('ngSchemaFile', ['Upload', 'CookieService', 'ConfigService', '$timeout', '$q', function (Upload, CookieService, ConfigService, $timeout, $q) {
      return {
        restrict: 'A',
        scope:    true,
        require:  'ngModel',
        link:     function (scope, element, attrs, ngModel) {
          scope.url = ConfigService.getFileUrl();
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

angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/nwp-file/nwp-file.html","<ng-form sf-array=\"form\" class=\"{{form.htmlClass}} file-upload mb-lg\" ng-schema-file ng-file-count-validator ng-model=\"$$value$$\" name=\"uploadForm\">\n  <label ng-show=\"form.title && form.notitle !== true\" class=\"control-label\" for=\"fileInputButton\" ng-class=\"{\'sr-only\': !showTitle(), \'text-danger\': uploadForm.$error.required && !uploadForm.$pristine}\">\n    {{ form.title }}<i ng-show=\"form.required\">&nbsp;*</i>\n  </label>\n\n  <div ng-repeat=\"file in $$value$$\">\n    <div class=\"thumbnail-container\">\n      <label><a href=\"{{url}}/download/{{file.filename}}/{{schema.id}}/{{file.path}}\" download=\"{{file.originalname}}\">{{file.originalname}}</a></label>\n      <!-- api call to get file preview from server -->\n      <img ng-src=\"{{url}}/preview/{{file.filename}}/{{schema.id}}/{{file.path}}\" class=\"file-thumbnail\">\n      <button type=\"button\" class=\"btn btn-danger btn-xs\" ng-click=\"deleteFile(file)\">x</button>\n    </div>\n  </div>\n  <div class=\"clearfix\"></div>\n\n  <div ng-show=\"picFile\">\n    <div ng-include=\"\'uploadProcess.html\'\" class=\"mb\"></div>\n  </div>\n\n  <ul ng-show=\"picFiles && picFiles.length\" class=\"list-group process-files\">\n    <li class=\"list-group-item process-file\" ng-repeat=\"picFile in picFiles\">\n      <div ng-include=\"\'uploadProcess.html\'\"></div>\n    </li>\n  </ul>\n\n  <div class=\"well well-sm bg-white mb\" ng-class=\"{\'has-error border-danger\': (uploadForm.$error.required && !uploadForm.$pristine) || (hasError() && errorMessage(schemaError()))}\">\n    <small class=\"text-muted\" ng-show=\"form.description\" ng-bind-html=\"form.description\"></small>\n    <div ng-if=\"isSinglefileUpload\" ng-include=\"\'singleFileUpload.html\'\"></div>\n    <div ng-if=\"!isSinglefileUpload\" ng-include=\"\'multiFileUpload.html\'\"></div>\n    <div class=\"help-block mb0\" ng-show=\"uploadForm.$error.required && !uploadForm.$pristine\">{{ \'modules.attribute.fields.required.caption\' | translate }}</div>\n    <div class=\"help-block mb0\" ng-show=\"(hasError() && errorMessage(schemaError()))\" ng-bind-html=\"(hasError() && errorMessage(schemaError()))\"></div>\n  </div>\n</ng-form>\n\n<script type=\'text/ng-template\' id=\"uploadProcess.html\">\n  <div class=\"mb\">\n    <div class=\"col-sm-4 mb-sm\">\n      <label title=\"{{ \'modules.upload.field.preview\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.preview\' | translate }}</label>\n      <img ngf-src=\"picFile\" class=\"img-thumbnail img-responsive\">\n      <div class=\"img-placeholder\"\n          ng-class=\"{\'show\': picFile.$invalid && !picFile.blobUrl, \'hide\': !picFile || picFile.blobUrl}\">Keine Vorschau verfügbar\n      </div>\n    </div>\n    <div class=\"col-sm-4 mb-sm\">\n      <label title=\"{{ \'modules.upload.field.filename\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.filename\' | translate }}</label>\n      <div class=\"filename\" title=\"{{ picFile.name }}\">{{ picFile.name }}</div>\n    </div>\n    <div class=\"col-sm-4 mb-sm\">\n      <label title=\"{{ \'modules.upload.field.progress\' | translate }}\" class=\"text-info\">{{\n        \'modules.upload.field.progress\' | translate }}</label>\n      <div class=\"progress\">\n        <div class=\"progress-bar progress-bar-striped\" role=\"progressbar\"\n            ng-class=\"{\'progress-bar-success\': picFile.progress == 100}\"\n            ng-style=\"{width: picFile.progress + \'%\'}\">\n          {{ picFile.progress }} %\n        </div>\n      </div>\n      <button class=\"btn btn-primary btn-sm\" type=\"button\" ng-click=\"uploadFile(picFile, schema.id)\"\n              ng-disabled=\"!picFile || picFile.$error\">{{ \"buttons.upload\" | translate }}\n      </button>\n    </div>\n  </div>\n  <div ng-messages=\"uploadForm.$error\" ng-messages-multiple=\"\">\n    <div class=\"text-danger errorMsg\" ng-message=\"maxSize\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong>. ({{ form.schema[picFile.$error].validationMessage2 | translate }} <strong>{{picFile.size / 1000000|number:1}}MB</strong>)</div>\n    <div class=\"text-danger errorMsg\" ng-message=\"pattern\">{{ form.schema[picFile.$error].validationMessage | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n    <div class=\"text-danger errorMsg\" ng-message=\"maxItems\">{{ form.schema[picFile.$error + \"ValidationMessage\"] | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n    <div class=\"text-danger errorMsg\" ng-message=\"minItems\">{{ form.schema[picFile.$error + \"ValidationMessage\"] | translate }} <strong>{{picFile.$errorParam}}</strong></div>\n    <div class=\"text-danger errorMsg\" ng-show=\"errorMsg\">{{errorMsg}}</div>\n  </div>\n</script>\n\n<script type=\'text/ng-template\' id=\"singleFileUpload.html\">\n  <div ngf-drop=\"selectFile(picFile)\" ngf-select=\"selectFile(picFile)\" type=\"file\" ngf-multiple=\"false\"\n      ng-model=\"picFile\" name=\"file\"\n      ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n      ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n      ng-required=\"form.required\"\n      accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n      ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n    <p class=\"text-center\">{{ \'modules.upload.descriptionSinglefile\' | translate }}</p>\n  </div>\n  <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n  <button ngf-select=\"selectFile(picFile)\" type=\"button\" ngf-multiple=\"false\" ng-model=\"picFile\" name=\"file\"\n    ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"{{form.schema.pattern && form.schema.pattern.mimeType}}\"\n    ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n    class=\"btn btn-primary btn-block {{form.htmlClass}} mt-lg mb\">\n      <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n      {{ \"buttons.add\" | translate }}\n  </button>\n</script>\n\n<script type=\'text/ng-template\' id=\"multiFileUpload.html\">\n  <div ngf-drop=\"selectFiles(picFiles)\" ngf-select=\"selectFiles(picFiles)\" type=\"file\" ngf-multiple=\"true\"\n    ng-model=\"picFiles\" name=\"files\"\n    ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n    ng-required=\"form.required\"\n    accept=\"*\"\n    ng-model-options=\"form.ngModelOptions\" ngf-drag-over-class=\"dragover\" class=\"drop-box dragAndDropDescription\">\n    <p class=\"text-center\">{{ \'modules.upload.descriptionMultifile\' | translate }}</p>\n  </div>\n  <div ngf-no-file-drop>{{ \'modules.upload.dndNotSupported\' | translate}}</div>\n\n  <button ngf-select=\"selectFiles(picFiles)\" type=\"button\" ngf-multiple=\"true\" multiple ng-model=\"picFiles\" name=\"files\"\n    accept=\"*\"\n    ng-attr-ngf-pattern=\"{{form.schema.pattern && form.schema.pattern.mimeType ? form.schema.pattern.mimeType : undefined }}\"\n    ng-attr-ngf-max-size=\"{{form.schema.maxSize && form.schema.maxSize.maximum ? form.schema.maxSize.maximum : undefined }}\"\n    ng-required=\"form.required\"\n    ng-model-options=\"form.ngModelOptions\" id=\"fileInputButton\"\n    class=\"btn btn-primary btn-block mt-lg mb\">\n     <fa fw=\"fw\" name=\"upload\" class=\"mr-sm\"></fa>\n     {{ \"buttons.add\" | translate }}\n  </button>\n</script>\n");}]);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNjaGVtYS1mb3JtLWZpbGUuanMiLCJ0ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzhFQ2pOQSIsImZpbGUiOiJzY2hlbWEtZm9ybS1maWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5hbmd1bGFyXG4gIC5tb2R1bGUoJ3NjaGVtYUZvcm0nKVxuICAuY29uZmlnKFsnc2NoZW1hRm9ybVByb3ZpZGVyJywgJ3NjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXInLCAnc2ZQYXRoUHJvdmlkZXInLFxuICAgIGZ1bmN0aW9uIChzY2hlbWFGb3JtUHJvdmlkZXIsIHNjaGVtYUZvcm1EZWNvcmF0b3JzUHJvdmlkZXIsIHNmUGF0aFByb3ZpZGVyKSB7XG4gICAgICB2YXIgZGVmYXVsdFBhdHRlcm5Nc2cgID0gJ1dyb25nIGZpbGUgdHlwZS4gQWxsb3dlZCB0eXBlcyBhcmUgJyxcbiAgICAgICAgICBkZWZhdWx0TWF4U2l6ZU1zZzEgPSAnVGhpcyBmaWxlIGlzIHRvbyBsYXJnZS4gTWF4aW11bSBzaXplIGFsbG93ZWQgaXMgJyxcbiAgICAgICAgICBkZWZhdWx0TWF4U2l6ZU1zZzIgPSAnQ3VycmVudCBmaWxlIHNpemU6JyxcbiAgICAgICAgICBkZWZhdWx0TWluSXRlbXNNc2cgPSAnWW91IGhhdmUgdG8gdXBsb2FkIGF0IGxlYXN0IG9uZSBmaWxlJyxcbiAgICAgICAgICBkZWZhdWx0TWF4SXRlbXNNc2cgPSAnWW91IGNhblxcJ3QgdXBsb2FkIG1vcmUgdGhhbiBvbmUgZmlsZS4nO1xuXG4gICAgICB2YXIgbndwU2luZ2xlZmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChuYW1lLCBzY2hlbWEsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHNjaGVtYS50eXBlID09PSAnYXJyYXknICYmIHNjaGVtYS5mb3JtYXQgPT09ICdzaW5nbGVmaWxlJykge1xuICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdFBhdHRlcm5Nc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4U2l6ZSAmJiBzY2hlbWEubWF4U2l6ZS5tYXhpbXVtICYmICFzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UgID0gZGVmYXVsdE1heFNpemVNc2cxO1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmICFzY2hlbWEubWluSXRlbXNWYWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zVmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgIXNjaGVtYS5tYXhJdGVtc1ZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICBzY2hlbWEubWF4SXRlbXNWYWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwU2luZ2xlZmlsZVVwbG9hZCk7XG5cbiAgICAgIHZhciBud3BNdWx0aWZpbGVVcGxvYWQgPSBmdW5jdGlvbiAobmFtZSwgc2NoZW1hLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChzY2hlbWEudHlwZSA9PT0gJ2FycmF5JyAmJiBzY2hlbWEuZm9ybWF0ID09PSAnbXVsdGlmaWxlJykge1xuICAgICAgICAgIGlmIChzY2hlbWEucGF0dGVybiAmJiBzY2hlbWEucGF0dGVybi5taW1lVHlwZSAmJiAhc2NoZW1hLnBhdHRlcm4udmFsaWRhdGlvbk1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHNjaGVtYS5wYXR0ZXJuLnZhbGlkYXRpb25NZXNzYWdlID0gZGVmYXVsdFBhdHRlcm5Nc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4U2l6ZSAmJiBzY2hlbWEubWF4U2l6ZS5tYXhpbXVtICYmICFzY2hlbWEubWF4U2l6ZS52YWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UgID0gZGVmYXVsdE1heFNpemVNc2cxO1xuICAgICAgICAgICAgc2NoZW1hLm1heFNpemUudmFsaWRhdGlvbk1lc3NhZ2UyID0gZGVmYXVsdE1heFNpemVNc2cyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc2NoZW1hLm1pbkl0ZW1zICYmICFzY2hlbWEubWluSXRlbXNWYWxpZGF0aW9uTWVzc2FnZSkge1xuICAgICAgICAgICAgc2NoZW1hLm1pbkl0ZW1zVmFsaWRhdGlvbk1lc3NhZ2UgPSBkZWZhdWx0TWluSXRlbXNNc2c7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChzY2hlbWEubWF4SXRlbXMgJiYgIXNjaGVtYS5tYXhJdGVtc1ZhbGlkYXRpb25NZXNzYWdlKSB7XG4gICAgICAgICAgICBzY2hlbWEubWF4SXRlbXNWYWxpZGF0aW9uTWVzc2FnZSA9IGRlZmF1bHRNYXhJdGVtc01zZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgZiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBzY2hlbWFGb3JtUHJvdmlkZXIuc3RkRm9ybU9iaihuYW1lLCBzY2hlbWEsIG9wdGlvbnMpO1xuICAgICAgICAgIGYua2V5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IG9wdGlvbnMucGF0aDtcbiAgICAgICAgICBmLnR5cGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSAnbndwRmlsZVVwbG9hZCc7XG4gICAgICAgICAgb3B0aW9ucy5sb29rdXBbc2ZQYXRoUHJvdmlkZXIuc3RyaW5naWZ5KG9wdGlvbnMucGF0aCldID0gZjtcbiAgICAgICAgICByZXR1cm4gZjtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgc2NoZW1hRm9ybVByb3ZpZGVyLmRlZmF1bHRzLmFycmF5LnVuc2hpZnQobndwTXVsdGlmaWxlVXBsb2FkKTtcblxuICAgICAgc2NoZW1hRm9ybURlY29yYXRvcnNQcm92aWRlci5hZGRNYXBwaW5nKFxuICAgICAgICAnYm9vdHN0cmFwRGVjb3JhdG9yJyxcbiAgICAgICAgJ253cEZpbGVVcGxvYWQnLFxuICAgICAgICAnZGlyZWN0aXZlcy9kZWNvcmF0b3JzL2Jvb3RzdHJhcC9ud3AtZmlsZS9ud3AtZmlsZS5odG1sJ1xuICAgICAgKTtcbiAgICB9XG4gIF0pO1xuXG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hRm9ybScpLmRpcmVjdGl2ZShcbiAgJ25nRmlsZUNvdW50VmFsaWRhdG9yJywgW1xuICAgIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcbiAgICAgICAgICB2YXIgdmFsaWQgPSBzY29wZS5mb3JtLnNjaGVtYS5tYXhJdGVtcyA/IChzY29wZS5tb2RlbC5pbWFnZXMgPyBzY29wZS5tb2RlbC5pbWFnZXMubGVuZ3RoIDogMCkgPCBzY29wZS5mb3JtLnNjaGVtYS5tYXhJdGVtcyA6IHRydWU7XG4gICAgICAgICAgbmdNb2RlbC4kcGFyc2Vycy51bnNoaWZ0KGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBuZ01vZGVsLiRzZXRWYWxpZGl0eSgnbmdGaWxlQ291bnRWYWxpZGF0b3InLCB2YWxpZCk7XG4gICAgICAgICAgICByZXR1cm4gdmFsaWQgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG5nTW9kZWwuJGZvcm1hdHRlcnMudW5zaGlmdChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgbmdNb2RlbC4kc2V0VmFsaWRpdHkoJ25nRmlsZUNvdW50VmFsaWRhdG9yJywgdmFsaWQpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbGlkID8gdmFsdWUgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIF1cbik7XG5cbmFuZ3VsYXJcbiAgIC5tb2R1bGUoJ25nU2NoZW1hRm9ybUZpbGUnLCBbXG4gICAgICAnbmdGaWxlVXBsb2FkJyxcbiAgICAgICduZ01lc3NhZ2VzJ1xuICAgXSlcbiAgIC5kaXJlY3RpdmUoJ25nU2NoZW1hRmlsZScsIFsnVXBsb2FkJywgJ0Nvb2tpZVNlcnZpY2UnLCAnQ29uZmlnU2VydmljZScsICckdGltZW91dCcsICckcScsIGZ1bmN0aW9uIChVcGxvYWQsIENvb2tpZVNlcnZpY2UsIENvbmZpZ1NlcnZpY2UsICR0aW1lb3V0LCAkcSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgc2NvcGU6ICAgIHRydWUsXG4gICAgICAgIHJlcXVpcmU6ICAnbmdNb2RlbCcsXG4gICAgICAgIGxpbms6ICAgICBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG4gICAgICAgICAgc2NvcGUudXJsID0gQ29uZmlnU2VydmljZS5nZXRGaWxlVXJsKCk7XG4gICAgICAgICAgdmFyIHRva2VuID0gQ29va2llU2VydmljZS5nZXRUb2tlbigpO1xuICAgICAgICAgIHNjb3BlLmlzU2luZ2xlZmlsZVVwbG9hZCA9IHNjb3BlLmZvcm0gJiYgc2NvcGUuZm9ybS5zY2hlbWEgJiYgc2NvcGUuZm9ybS5zY2hlbWEuZm9ybWF0ID09PSAnc2luZ2xlZmlsZSc7XG5cbiAgICAgICAgICBzY29wZS5zZWxlY3RGaWxlICA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICBzY29wZS5waWNGaWxlID0gZmlsZTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHNjb3BlLnNlbGVjdEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgICAgICBzY29wZS5waWNGaWxlcyA9IGZpbGVzO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBzY29wZS51cGxvYWRGaWxlID0gZnVuY3Rpb24gKGZpbGUsIHNjaGVtYUlkKSB7XG4gICAgICAgICAgICBmaWxlICYmIGRvVXBsb2FkKGZpbGUsIHRva2VuLCBzY2hlbWFJZCk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHNjb3BlLnVwbG9hZEZpbGVzID0gZnVuY3Rpb24gKGZpbGVzLCBzY2hlbWFJZCkge1xuICAgICAgICAgICAgZmlsZXMubGVuZ3RoICYmIGFuZ3VsYXIuZm9yRWFjaChmaWxlcywgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgZG9VcGxvYWQoZmlsZSwgdG9rZW4sIHNjaGVtYUlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBmdW5jdGlvbiBkb1VwbG9hZChmaWxlLCB0b2tlbiwgc2NoZW1hSWQpIHtcbiAgICAgICAgICAgIGlmICgoc2NvcGUubW9kZWwuaW1hZ2VzID8gc2NvcGUubW9kZWwuaW1hZ2VzLmxlbmd0aCA6IDApICsgMSA+IHNjb3BlLmZvcm0uc2NoZW1hLm1heEl0ZW1zKSB7XG4gICAgICAgICAgICAgIHNjb3BlLnVwbG9hZEZvcm0uJGVycm9yLm1heEl0ZW1zID0gdHJ1ZTtcbiAgICAgICAgICAgICAgZmlsZS4kZXJyb3IgPSBcIm1heEl0ZW1zXCI7XG4gICAgICAgICAgICAgIGZpbGUuJGVycm9yUGFyYW0gPSAoc2NvcGUubW9kZWwuaW1hZ2VzID8gc2NvcGUubW9kZWwuaW1hZ2VzLmxlbmd0aCA6IDApICsgMSArIFwiLiBEYXRlaSwgXCIgKyBzY29wZS5mb3JtLnNjaGVtYS5tYXhJdGVtcyArIFwiIERhdGVpZW4gZXJsYXVidC5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWxlICYmICFmaWxlLiRlcnJvciAmJiBzY29wZS51cmwpIHtcbiAgICAgICAgICAgICAgZmlsZS51cGxvYWQgPSBVcGxvYWQudXBsb2FkKHtcbiAgICAgICAgICAgICAgICB1cmw6ICBzY29wZS51cmwsXG4gICAgICAgICAgICAgICAgZmlsZTogZmlsZSxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICBzY2hlbWFJZDogc2NoZW1hSWQsXG4gICAgICAgICAgICAgICAgICBwYXRoOiBzY29wZS5mb3JtLnBhdGhcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnWC1BcmNoaWJhbGQtVG9rZW4nOiB0b2tlbn1cbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgZmlsZS51cGxvYWQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBmaWxlLnJlc3VsdCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgZmlsZSBvbiB0aGF0IHByb3BlcnR5IGluIHJlY29yZFxuICAgICAgICAgICAgICAgIGlmICghbmdNb2RlbC4kdmlld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUoW3Jlc3BvbnNlLmRhdGFdKTtcbiAgICAgICAgICAgICAgICAvLyBwcm9wZXJ0eSBhbHJlYWR5IGhhcyBmaWxlc1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJHZpZXdWYWx1ZS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLmZpbGVuYW1lID09IHJlc3BvbnNlLmRhdGEuZmlsZW5hbWUpIHsgZm91bmQgPSB0cnVlOyB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmdNb2RlbC4kdmlld1ZhbHVlLnB1c2gocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5nTW9kZWwuJGNvbW1pdFZpZXdWYWx1ZSgpO1xuICAgICAgICAgICAgICAgIC8vIGVtcHRpZXMgZmlsZWlucHV0IGZvciBvbmUgZmlsZSBhZnRlciBiZWluZyB1cGxvYWRlZCwgdGltZW91dFxuICAgICAgICAgICAgICAgIC8vIHRvIHdhaXQgZm9yIHByb2dyZXNzYmFyIHRvIGNoYW5nZSBiZWZvcmUgcmVtb3ZpbmcgZmlsZSB0aHJvdWdoXG4gICAgICAgICAgICAgICAgLy8gYW5pbWF0aW9uIGZyb20gdGhlIGZpbGVwaWNrZXJcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICBzY29wZS5waWNGaWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChwaWNGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLmJsb2JVcmwgPT0gcGljRmlsZS5ibG9iVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc2NvcGUucGljRmlsZXMuc3BsaWNlKHNjb3BlLnBpY0ZpbGVzLmluZGV4T2YocGljRmlsZSksMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXBsb2FkRm9ybS4kc2V0RGlydHkoKTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID4gMCkge1xuICAgICAgICAgICAgICAgICAgc2NvcGUuZXJyb3JNc2cgPSByZXNwb25zZS5zdGF0dXMgKyAnOiAnICsgcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIGZpbGUudXBsb2FkLnByb2dyZXNzKGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICBmaWxlLnByb2dyZXNzID0gTWF0aC5taW4oMTAwLCBwYXJzZUludCgxMDAuMCAqXG4gICAgICAgICAgICAgICAgICBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGRlbGV0ZXMgYSBmaWxlIGZyb20gYSByZWNvcmQsIHRoZSBmaWxlIGFuZCBpdCdzIGRhdGFiYXNlIGVudHJ5IGFyZSBsZWZ0XG4gICAgICAgICAgLy8gc2luY2UgdGhhdCBzY2VuYXJpbyBpcyBhc3N1bWVkIHRvIGJlIHVubGlrZWx5IGFuZCBiZXR0ZXIgZGVhbHQgd2l0aCBpblxuICAgICAgICAgIC8vIGZ1dHVyZSBhcyBvZiBub3dcbiAgICAgICAgICBzY29wZS5kZWxldGVGaWxlID0gZnVuY3Rpb24gKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICB2YXIgZmlsZXMgPSBbXTtcbiAgICAgICAgICAgIG5nTW9kZWwuJHZpZXdWYWx1ZS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgIGlmIChmaWxlICE9IGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUoZmlsZXMpO1xuICAgICAgICAgICAgaWYgKHNjb3BlLnBpY0ZpbGVzKSB7XG4gICAgICAgICAgICAgIHNjb3BlLnBpY0ZpbGVzLmZvckVhY2goZnVuY3Rpb24gKHBpY0ZpbGUpIHtcbiAgICAgICAgICAgICAgICBpZiAocGljRmlsZS4kZXJyb3IgPT0gXCJtYXhJdGVtc1wiKSB7XG4gICAgICAgICAgICAgICAgICBkZWxldGUgcGljRmlsZS4kZXJyb3I7XG4gICAgICAgICAgICAgICAgICBkZWxldGUgcGljRmlsZS4kZXJyb3JQYXJhbTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgfV0pO1xuIixudWxsXX0=
