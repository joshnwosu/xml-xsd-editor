import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Loader2,
  FileCheck,
  AlertCircle,
  RefreshCw,
  FileText,
  Shield,
} from 'lucide-react';
import { useFileStore } from '@/store/file-store';
import { useValidation } from '@/hooks/use-validation';
import { XMLValidator } from '@/utils/xml-validator';

export function ValidationPanel() {
  const { xmlContent, xsdContent } = useFileStore();
  const {
    isValidating,
    lastValidation,
    validationTimestamp,
    validateFiles,
    clearValidation,
  } = useValidation();

  const handleValidate = () => {
    validateFiles(xmlContent, xsdContent);
  };

  const canValidate = xmlContent.trim() && xsdContent.trim();

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className='w-5 h-5 animate-spin text-blue-600' />;
    }

    if (!lastValidation) {
      return <FileCheck className='w-5 h-5 text-slate-400' />;
    }

    if (lastValidation.isValid) {
      return lastValidation.warnings.length > 0 ? (
        <AlertTriangle className='w-5 h-5 text-amber-500' />
      ) : (
        <CheckCircle className='w-5 h-5 text-emerald-500' />
      );
    }

    return <XCircle className='w-5 h-5 text-red-500' />;
  };

  const getStatusText = () => {
    if (isValidating) {
      return 'Validating documents...';
    }

    if (!lastValidation) {
      return 'Ready to validate';
    }

    return XMLValidator.getValidationSummary(lastValidation);
  };

  const getStatusBadgeStyle = () => {
    if (isValidating) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (!lastValidation) return 'bg-slate-50 text-slate-600 border-slate-200';
    if (lastValidation.isValid) {
      return lastValidation.warnings.length > 0
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between pb-4 border-b border-slate-100'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-blue-50 rounded-lg'>
            <Shield className='w-5 h-5 text-blue-600' />
          </div>
          <div>
            <p className='text-lg font-semibold text-slate-900'>
              XML Schema Validation
            </p>
            <p className='text-sm text-slate-500 mt-0.5'>
              Validate XML documents against XSD schema
            </p>
          </div>
        </div>
        {validationTimestamp && (
          <div className='text-right'>
            <span className='text-xs text-slate-400 block'>Last validated</span>
            <span className='text-sm text-slate-600 font-medium'>
              {validationTimestamp.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div
        className={`inline-flex items-center space-x-3 px-4 py-3 rounded-lg border ${getStatusBadgeStyle()}`}
      >
        {getStatusIcon()}
        <span className='font-medium'>{getStatusText()}</span>
      </div>

      {/* File Status Cards */}
      <div className='grid grid-cols-2 gap-4'>
        <div
          className={`p-4 rounded-lg border transition-all ${
            xmlContent.trim()
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <FileText
              className={`w-5 h-5 ${
                xmlContent.trim() ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <div>
              <div className='font-medium text-slate-900'>XML Document</div>
              <div
                className={`text-sm ${
                  xmlContent.trim() ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                {xmlContent.trim() ? 'Loaded & Ready' : 'Not loaded'}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border transition-all ${
            xsdContent.trim()
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className='flex items-center space-x-3'>
            <Shield
              className={`w-5 h-5 ${
                xsdContent.trim() ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <div>
              <div className='font-medium text-slate-900'>XSD Schema</div>
              <div
                className={`text-sm ${
                  xsdContent.trim() ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                {xsdContent.trim() ? 'Loaded & Ready' : 'Not loaded'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center space-x-3 pt-2'>
        <Button
          onClick={handleValidate}
          disabled={!canValidate || isValidating}
          className='flex items-center space-x-2 px-6 py-2.5 font-medium text-white'
          size='lg'
        >
          {isValidating ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Play className='w-4 h-4' />
          )}
          <span>{isValidating ? 'Validating...' : 'Validate Documents'}</span>
        </Button>

        {lastValidation && (
          <Button
            variant='outline'
            onClick={clearValidation}
            className='flex items-center space-x-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5'
            size='lg'
          >
            <RefreshCw className='w-4 h-4' />
            <span>Clear Results</span>
          </Button>
        )}
      </div>

      {/* Validation Results */}
      {lastValidation && (
        <div className='border-t border-slate-100 pt-6 space-y-4'>
          {/* Errors */}
          {lastValidation.errors.length > 0 && (
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <div className='p-1.5 bg-red-100 rounded-md'>
                  <AlertCircle className='w-4 h-4 text-red-600' />
                </div>
                <span className='font-semibold text-red-700'>
                  {lastValidation.errors.length} Error
                  {lastValidation.errors.length !== 1 ? 's' : ''} Found
                </span>
              </div>
              <div className='bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 space-y-2'>
                {lastValidation.errors.map((error, index) => (
                  <div key={index} className='flex items-start space-x-2'>
                    <div className='w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0' />
                    <span className='text-sm text-red-800 leading-relaxed'>
                      {error}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {lastValidation.warnings.length > 0 && (
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <div className='p-1.5 bg-amber-100 rounded-md'>
                  <AlertTriangle className='w-4 h-4 text-amber-600' />
                </div>
                <span className='font-semibold text-amber-700'>
                  {lastValidation.warnings.length} Warning
                  {lastValidation.warnings.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className='bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4 space-y-2'>
                {lastValidation.warnings.map((warning, index) => (
                  <div key={index} className='flex items-start space-x-2'>
                    <div className='w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0' />
                    <span className='text-sm text-amber-800 leading-relaxed'>
                      {warning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success message */}
          {lastValidation.isValid &&
            lastValidation.errors.length === 0 &&
            lastValidation.warnings.length === 0 && (
              <div className='bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg p-4'>
                <div className='flex items-center space-x-3'>
                  <div className='p-1.5 bg-emerald-100 rounded-md'>
                    <CheckCircle className='w-4 h-4 text-emerald-600' />
                  </div>
                  <div>
                    <div className='font-semibold text-emerald-800'>
                      Validation Successful
                    </div>
                    <div className='text-sm text-emerald-700 mt-0.5'>
                      XML document is fully compliant with the XSD schema
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
