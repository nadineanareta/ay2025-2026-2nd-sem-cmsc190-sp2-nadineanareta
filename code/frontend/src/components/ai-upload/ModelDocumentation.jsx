import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, Link as LinkIcon, List, Code, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ModelDocumentation = ({ description, onDescriptionChange, showFeedback, formData, stepNumber }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef(null);

  const isFormComplete = formData?.model_name && formData?.architecture && formData?.crop && formData?.dataset_id && formData?.dataset_id !== "";

  const handleReadmeUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => onDescriptionChange(event.target.result);
      reader.readAsText(file);
    } else if (file) {
      showFeedback("error", "Invalid File", "Please upload a valid .md (Markdown) file.");
    }
    e.target.value = null; 
  };

  const insertFormatting = (e, prefix, suffix = "") => {
    e.preventDefault();
    
    const textarea = textareaRef.current || document.getElementById('markdown-textarea');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = description || ""; 
    
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    
    onDescriptionChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      const cursorPosition = selectedText.length === 0 
        ? start + prefix.length 
        : start + prefix.length + selectedText.length;
      
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 50);
  };

  const generateAITemplate = () => {
    if (!isFormComplete) return;
    
    setIsGenerating(true);
    
    setTimeout(() => {
      const { model_name, model_type, architecture, crop, classes, tags } = formData;
      
      const metricsText = model_type === "Object Detection" 
        ? `- **mAP@50:** ${formData.metrics_map50 || "N/A"}%\n- **mAP@50-95:** ${formData.metrics_map50_95 || "N/A"}%\n- **Precision:** ${formData.metrics_precision || "N/A"}%\n- **Recall:** ${formData.metrics_recall || "N/A"}%`
        : `- **Top-1 Accuracy:** ${formData.metrics_top1_acc || "N/A"}%\n- **Top-5 Accuracy:** ${formData.metrics_top5_acc || "N/A"}%\n- **Training Loss:** ${formData.metrics_train_loss || "N/A"}%\n- **Validation Loss:** ${formData.metrics_val_loss || "N/A"}`;

      const classesText = classes && classes.length > 0 
        ? classes.map(c => `- ${c}`).join('\n') 
        : "- No specific classes defined yet.";

      const generatedMarkdown = `# ${model_name || "Untitled Model"}\n\n## Overview\nThis is ${model_type === "Object Detection" ? "an" : "a"} **${model_type || "machine learning"}** model built using the **${architecture || "specified"}** architecture. It is specifically designed and trained to analyze **${crop || "agricultural"}** data.\n\n## Performance Metrics\nBased on the latest evaluation, the model achieved the following verified metrics:\n\n${metricsText}\n\n## Supported Classes / Capabilities\nThis model has been trained to detect or classify the following:\n\n${classesText}\n\n## Technical Details\n- **Framework:** ${architecture || "N/A"}\n- **Keywords:** ${tags && tags.length > 0 ? tags.join(", ") : "N/A"}\n\n## Usage Instructions\n*Describe how another developer should run your model here. Include code snippets if necessary:*\n\n\`\`\`python\n# Example initialization\nmodel = load_model("path/to/model")\nresults = model.predict(image)\n\`\`\`\n`;
      
      onDescriptionChange(generatedMarkdown);
      setIsPreviewMode(true); 
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full">            
      <div className="flex flex-col mb-4">
        <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2">
          {stepNumber && (
            <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">
              {stepNumber}
            </span>
          )}
          Documentation <span className="text-red-500">*</span>
        </h2>
        <p className="text-[11px] text-gray-500 mt-1 ml-8 leading-relaxed">
          Write a clear guide for other developers. What does this model do? How was it trained? How can they use it in their code? Use the auto-generate button if you need a head start!
        </p>
      </div>

      <div className="space-y-2 flex-grow flex flex-col min-h-[300px] md:min-h-[400px]">            
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center pb-2 border-b mb-2 gap-3">
          
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsPreviewMode(false)} className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${!isPreviewMode ? "bg-gray-100 text-spidhive-black" : "text-gray-500 hover:text-gray-800"}`}>Write</button>
            <button type="button" onClick={() => setIsPreviewMode(true)} className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${isPreviewMode ? "bg-gray-100 text-spidhive-black" : "text-gray-500 hover:text-gray-800"}`}>Preview</button>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <Button type="button" variant="ghost" size="sm" className="text-[10px] md:text-xs h-8 text-gray-500 hover:text-red-600" onClick={() => onDescriptionChange("")}>
              <RotateCcw size={14} className="mr-1" /> Clear All
            </Button>
            
            <Button 
              type="button" 
              size="sm" 
              className={`text-[10px] md:text-xs h-8 ${isFormComplete ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"}`} 
              onClick={generateAITemplate}
              disabled={isGenerating || !isFormComplete}
              title={!isFormComplete ? "Please fill out the Basic Details and Dataset first." : "Generate a documentation template"}
            >
              {isGenerating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
              {isGenerating ? "Drafting..." : "Auto-Generate"}
            </Button>

            <input type="file" accept=".md" id="readme-upload" className="hidden" onChange={handleReadmeUpload} />
            <Button type="button" variant="outline" size="sm" className="text-[10px] md:text-xs h-8 text-spidhive-dark-green border-spidhive-dark-green/30 hover:bg-spidhive-light-green/10" onClick={() => document.getElementById('readme-upload').click()}>
              Upload README.md
            </Button>
          </div>
        </div>             
        
        {!isPreviewMode && (
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1.5 px-3">
            <button type="button" onMouseDown={(e) => insertFormatting(e, "**", "**")} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Bold"><Bold size={14} /></button>
            <button type="button" onMouseDown={(e) => insertFormatting(e, "*", "*")} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Italic"><Italic size={14} /></button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button type="button" onMouseDown={(e) => insertFormatting(e, "- ")} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="List"><List size={14} /></button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button type="button" onMouseDown={(e) => insertFormatting(e, "[Title](", ")")} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Link"><LinkIcon size={14} /></button>
            <button type="button" onMouseDown={(e) => insertFormatting(e, "`", "`")} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Inline Code"><Code size={14} /></button>
          </div>
        )}

        {isPreviewMode ? (
          <div className="bg-white border border-gray-200 rounded-md flex-grow overflow-y-auto p-4 min-h-[300px] md:min-h-[300px]">
            {description ? (
              <div className="prose prose-sm max-w-none text-gray-700 
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-spidhive-black [&_h1]:mb-4 
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-spidhive-black [&_h2]:mt-6 [&_h2]:mb-3 
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-spidhive-black [&_h3]:mt-4 [&_h3]:mb-2 
                [&_p]:mb-4 [&_p]:leading-relaxed 
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 
                [&_strong]:font-bold [&_strong]:text-black 
                [&_em]:italic 
                [&_a]:text-spidhive-dark-green [&_a]:underline 
                [&_code]:bg-gray-100 [&_code]:text-red-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm 
                [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
              </div>
            ) : <div className="h-full flex items-center justify-center text-gray-400 italic">Nothing to preview.</div>}
          </div>
        ) : (
          <Textarea 
            id="markdown-textarea"
            ref={textareaRef}
            name="model_description" 
            required={!isPreviewMode}
            value={description} 
            onChange={(e) => onDescriptionChange(e.target.value)} 
            wrap="off"
            placeholder="Add deployment notes, quirks, or standard Markdown here..."
            className={`bg-gray-50 flex-grow resize-none w-full overflow-x-auto focus-visible:border-spidhive-light-green focus-visible:ring-1 text-sm p-4 min-h-[300px] md:min-h-[300px] "border-spidhive-light-green border-2"}`} 
          />
        )}
      </div>
    </div>
  );
};

export default ModelDocumentation;