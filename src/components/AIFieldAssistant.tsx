import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Wand2, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Copy,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { generateAIContent, validateFieldContent, getFieldConfiguration } from '../utils/aiContentGeneration';

interface AIFieldAssistantProps {
  fieldName: string;
  fieldType: string;
  currentValue: string | string[];
  onContentGenerated: (content: string | string[]) => void;
  nutrientName: string;
  category: string;
  placeholder?: string;
  className?: string;
}

export function AIFieldAssistant({
  fieldName,
  fieldType,
  currentValue,
  onContentGenerated,
  nutrientName,
  category,
  placeholder,
  className
}: AIFieldAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | string[]>('');
  const [guidance, setGuidance] = useState<string>('');

  const fieldConfig = getFieldConfiguration(fieldName);
  const validation = currentValue ? validateFieldContent(fieldName, currentValue) : null;

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setShowPreview(false);
    
    try {
      const result = await generateAIContent({
        fieldName,
        fieldType,
        currentValue: Array.isArray(currentValue) ? currentValue.join(', ') : currentValue,
        nutrientName,
        category,
        maxLength: fieldConfig?.maxLength,
        minLength: fieldConfig?.minLength,
        isArray: fieldConfig?.isArray
      });

      if (result.success && result.content) {
        setGeneratedContent(result.content);
        setGuidance(result.guidance || '');
        setShowPreview(true);
        toast.success('✨ AI content generated! Review and apply if satisfied.');
      } else {
        toast.error(`❌ ${result.error || 'Failed to generate content'}`);
        if (result.guidance) {
          setGuidance(result.guidance);
        }
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error('❌ Failed to generate AI content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyContent = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent);
      setShowPreview(false);
      toast.success('✅ Content applied successfully!');
    }
  };

  const handleCopyContent = async () => {
    try {
      const textContent = Array.isArray(generatedContent) 
        ? generatedContent.join('\n') 
        : generatedContent;
      await navigator.clipboard.writeText(textContent);
      toast.success('📋 Content copied to clipboard');
    } catch (error) {
      toast.error('❌ Failed to copy content');
    }
  };

  const getCharacterCount = (content: string | string[]): number => {
    if (Array.isArray(content)) {
      return content.reduce((total, item) => total + item.length, 0);
    }
    return content.length;
  };

  const getItemCount = (content: string | string[]): number => {
    return Array.isArray(content) ? content.length : 1;
  };

  const renderFieldGuidance = () => {
    if (!fieldConfig) return null;

    return (
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {fieldConfig.minLength && (
            <Badge variant="outline" className="text-xs">
              Min: {fieldConfig.minLength} chars
            </Badge>
          )}
          {fieldConfig.maxLength && (
            <Badge variant="outline" className="text-xs">
              Max: {fieldConfig.maxLength} chars
            </Badge>
          )}
          {fieldConfig.isArray && (
            <Badge variant="secondary" className="text-xs">
              Array format
            </Badge>
          )}
        </div>
        
        {currentValue && (
          <div className="flex items-center gap-2 text-xs">
            <span>Current: {getCharacterCount(currentValue)} chars</span>
            {fieldConfig.isArray && (
              <span>• {getItemCount(currentValue)} items</span>
            )}
            {validation && !validation.isValid && (
              <Badge variant="destructive" className="text-xs">
                {validation.errors.length} errors
              </Badge>
            )}
            {validation && validation.warnings.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {validation.warnings.length} warnings
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderValidationMessages = () => {
    if (!validation) return null;

    return (
      <>
        {validation.errors.length > 0 && (
          <Alert className="mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Errors:</strong> {validation.errors.join(', ')}
            </AlertDescription>
          </Alert>
        )}
        {validation.warnings.length > 0 && (
          <Alert className="mb-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Warnings:</strong> {validation.warnings.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </>
    );
  };

  const renderPreview = () => {
    if (!showPreview || !generatedContent) return null;

    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-purple-800 flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            AI Generated Content
          </h4>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyContent}
              className="text-xs h-7"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              size="sm"
              onClick={handleApplyContent}
              className="text-xs h-7 bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded p-2 text-sm border max-h-32 overflow-y-auto">
          {Array.isArray(generatedContent) ? (
            <ul className="space-y-1">
              {generatedContent.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-500 text-xs mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{generatedContent}</p>
          )}
        </div>
        
        {guidance && (
          <div className="mt-2 text-xs text-purple-600">
            <Info className="h-3 w-3 inline mr-1" />
            {guidance}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Main AI Button - Prominently colored and positioned */}
      <div className="flex flex-col items-start gap-2">
        <Button
          size="sm"
          onClick={handleGenerateContent}
          disabled={isGenerating || !nutrientName}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs h-9 px-3 font-medium"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4 mr-1.5" />
          )}
          {isGenerating ? 'Generating...' : 'AI Assist'}
        </Button>
        
        {isGenerating && (
          <div className="text-xs text-purple-600 animate-pulse font-medium">
            Generating content...
          </div>
        )}
        
        {showPreview && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowPreview(false)}
            className="text-xs h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          >
            ×
          </Button>
        )}
      </div>

      {/* Validation and guidance - shown in a compact way */}
      {validation && !validation.isValid && (
        <div className="mt-2">
          <Badge variant="destructive" className="text-xs">
            {validation.errors.length} errors
          </Badge>
        </div>
      )}

      {renderPreview()}
      
      {!nutrientName && (
        <div className="text-xs text-amber-600 mt-2 flex items-center">
          <Info className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>Enter nutrient name first</span>
        </div>
      )}
    </div>
  );
}