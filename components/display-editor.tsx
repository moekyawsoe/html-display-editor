'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import {
  Trash2,
  Copy,
  Code,
  Plus,
  Edit,
  Minus,
  RotateCw,
  Moon,
  Sun,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  PanelLeft,
  PanelRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { CodeEditor } from './code-editor';
import { DeviceFrame } from './device-frame';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { TransparentColorPicker } from './transparent-color-picker';
import { MediaUploader } from './media-uploader';
import { ImportDialog } from './import-dialog';

const devicePresets = {
  mobile: { width: 375, height: 667, type: 'mobile' },
  tablet: { width: 768, height: 1024, type: 'tablet' },
  desktop: { width: 1280, height: 800, type: 'desktop' },
  tv: { width: 1920, height: 1080, type: 'tv' },
  kiosk: { width: 1080, height: 1920, type: 'kiosk' },
  monitor: { width: 1440, height: 900, type: 'monitor' },
};

const getDeviceSize = (devicePreset: string, orientation: string) => {
  const preset = devicePresets[devicePreset as keyof typeof devicePresets];
  if (orientation === 'landscape' && preset && preset.type !== 'tv' && preset.type !== 'monitor' && preset.type !== 'desktop') {
    return { width: preset.height, height: preset.width, type: preset.type };
  }
  return preset;
};

// Update the Element interface to support units and background images
interface Element {
  id: string;
  type: 'div' | 'button' | 'input' | 'heading' | 'paragraph' | 'grid' | 'grid-item';
  x: number;
  y: number;
  width: number;
  height: number;
  xUnit: 'px' | '%'; // New
  yUnit: 'px' | '%'; // New
  widthUnit: 'px' | '%';
  heightUnit: 'px' | '%';
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  borderStyle: string;
  content: Record<string, string>;
  zIndex: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  inputType?: string;
  gridColumns?: number;
  gridRows?: number;
  gridGap?: number;
  gridColumnStart?: number;
  gridColumnEnd?: number;
  gridRowStart?: number;
  gridRowEnd?: number;
  parentId?: string;
  name?: string;
  editable?: boolean;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

// Update the DisplayEditor component to include the wireframe toggle and use the DeviceFrame component
export function DisplayEditor() {
  const { theme, setTheme } = useTheme();
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showCode, setShowCode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<Element[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languages, setLanguages] = useState(['en']);
  const [devicePreset, setDevicePreset] = useState('desktop');
  const [orientation, setOrientation] = useState('portrait');
  const [showWireframe, setShowWireframe] = useState(true);
  const [editableHtml, setEditableHtml] = useState('');
  const [isEditingHtml, setIsEditingHtml] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<'html' | 'json' | 'yaml' | 'react'>('html');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [verticalAlign, setVerticalAlign] = useState<'top' | 'middle' | 'bottom'>('top');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Add state for toggling panels
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);

  // Add state for preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Add state for media library
  const [mediaLibrary, setMediaLibrary] = useState<{ id: string; type: 'image' | 'video'; url: string; name: string }[]>([]);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add this function to handle zoom changes
  const handleZoom = (newZoom: number) => {
    // Limit zoom between 0.25 and 3
    const clampedZoom = Math.max(0.25, Math.min(3, newZoom));
    setZoomLevel(clampedZoom);
  };

  // Save state to history when elements change
  useEffect(() => {
    if (elements.length > 0) {
      setHistory(prev => {
        const newHistory = [...prev.slice(0, historyIndex + 1), [...elements]];
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
    }
  }, [elements]);

  // Update the addElement function to include the new properties
  const addElement = (type: Element['type'] = 'div') => {
    const newElement: Element = {
      id: nanoid(),
      type,
      x: Math.round(50),
      y: Math.round(50),
      xUnit: 'px', // Default to pixels
      yUnit: 'px', // Default to pixels
      width: type === 'grid' ? 400 : 200,
      height: type === 'grid' ? 300 : 100,
      widthUnit: 'px',
      heightUnit: 'px',
      backgroundColor: type === 'button' ? '#3b82f6' : '#e2e8f0',
      borderRadius: type === 'button' ? 4 : 0,
      borderWidth: 0,
      borderColor: '#000000',
      borderStyle: 'solid',
      content: { en: type === 'input' ? 'Placeholder text' : 'New Element' },
      zIndex: elements.length,
      fontFamily: 'Inter, sans-serif',
      fontSize: 16,
      fontWeight: 'normal',
      name: `element_${nanoid(6)}`,
      editable: true,
      textColor: '#000000',
      textAlign: 'center',
      verticalAlign: 'middle',
      ...(type === 'input' && { inputType: 'text' }),
      ...(type === 'grid' && { gridColumns: 3, gridRows: 3, gridGap: 10 }),
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);

    // If it's a grid, add some grid items
    if (type === 'grid') {
      const gridItems = Array.from({ length: 3 }, (_, i) => ({
        id: nanoid(),
        type: 'grid-item',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        widthUnit: 'px',
        heightUnit: 'px',
        backgroundColor: '#f3f4f6',
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'solid',
        content: { en: `Grid Item ${i + 1}` },
        zIndex: elements.length + i + 1,
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: 'normal',
        parentId: newElement.id,
        gridColumnStart: (i % 3) + 1,
        gridColumnEnd: (i % 3) + 2,
        gridRowStart: Math.floor(i / 3) + 1,
        gridRowEnd: Math.floor(i / 3) + 2,
        name: `grid_item_${nanoid(6)}`,
        editable: true,
        textColor: '#000000',
        textAlign: 'center',
        verticalAlign: 'middle',
      }));

      setElements(prev => [...prev, ...gridItems]);
    }
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (id: string) => {
    const elementToDuplicate = elements.find(el => el.id === id);
    if (elementToDuplicate) {
      const newElement = {
        ...elementToDuplicate,
        id: nanoid(),
        x: elementToDuplicate.x + 20,
        y: elementToDuplicate.y + 20,
        zIndex: elements.length,
      };
      setElements([...elements, newElement]);
      setSelectedElement(newElement.id);
    }
  };

  const updateElement = (id: string, updates: Partial<Element>) => {
    setElements(elements.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (isPreviewMode) return; // Disable dragging in preview mode

    e.stopPropagation();
    setSelectedElement(id);

    const element = elements.find(el => el.id === id);
    if (element) {
      setIsDragging(true);
      // Get the canvas position to calculate the correct offset
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const rect = (e.target as HTMLElement).getBoundingClientRect();

      if (canvasRect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    if (isDragging && selectedElement && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const element = elements.find(el => el.id === selectedElement);

      if (element) {
        const newX = e.clientX - canvasRect.left - dragOffset.x;
        const newY = e.clientY - canvasRect.top - dragOffset.y;

        let updates: Partial<Element> = {};

        if (element.xUnit === '%' && element.yUnit === '%') {
          updates.x = Math.round((newX / canvasRect.width) * 100);
          updates.y = Math.round((newY / canvasRect.height) * 100);
        } else {
          updates.x = Math.round(Math.max(0, Math.min(newX, canvasRect.width - element.width)));
          updates.y = Math.round(Math.max(0, Math.min(newY, canvasRect.height - element.height)));
        }

        updateElement(selectedElement, updates);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add function to handle media upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (!fileType) return;

      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          const newMedia = {
            id: nanoid(),
            type: fileType as 'image' | 'video',
            url: event.target.result as string,
            name: file.name,
          };
          setMediaLibrary(prev => [...prev, newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Update the element rendering to include background images and units
  const renderElement = (element: Element) => {
    const style: React.CSSProperties = {
      left: `${element.x}${element.xUnit}`,
      top: `${element.y}${element.yUnit}`,
      width: `${element.width}${element.widthUnit}`,
      height: `${element.height}${element.heightUnit}`,
      backgroundColor: element.backgroundColor,
      borderRadius: `${element.borderRadius}px`,
      border: `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}`,
      zIndex: element.zIndex,
      fontFamily: element.fontFamily,
      fontSize: `${element.fontSize}px`,
      fontWeight: element.fontWeight,
      color: element.textColor || '#000000',
      display: 'flex',
      alignItems: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
      justifyContent:
        element.textAlign === 'left'
          ? 'flex-start'
          : element.textAlign === 'right'
            ? 'flex-end'
            : element.textAlign === 'center'
              ? 'center'
              : 'space-between',
    };

    // Add background image if it exists
    if (element.backgroundImage) {
      style.backgroundImage = `url(${element.backgroundImage})`;
      style.backgroundSize = element.backgroundSize || 'cover';
      style.backgroundPosition = element.backgroundPosition || 'center';
      style.backgroundRepeat = element.backgroundRepeat || 'no-repeat';
    }

    // For grid elements
    if (element.type === 'grid') {
      style.display = 'grid';
      style.gridTemplateColumns = `repeat(${element.gridColumns}, 1fr)`;
      style.gridTemplateRows = `repeat(${element.gridRows}, 1fr)`;
      style.gap = `${element.gridGap}px`;
    }

    return style;
  };

  // Update the HTML generation to include background images and units

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const selectedElementData = selectedElement ? elements.find(el => el.id === selectedElement) : null;

  const addLanguage = () => {
    const newLang = prompt('Enter new language code (e.g., fr, es, de):');
    if (newLang && !languages.includes(newLang)) {
      setLanguages([...languages, newLang]);

      // Add this language to all elements
      setElements(
        elements.map(el => {
          const updatedContent = { ...el.content };
          if (!updatedContent[newLang]) {
            updatedContent[newLang] = updatedContent.en || '';
          }
          return { ...el, content: updatedContent };
        }),
      );
    }
  };

  // Add a function to handle importing elements after the other functions
  const handleImportElements = (importedElements: any[]) => {
    try {
      // Convert imported elements to the application's format
      const newElements = importedElements.map(el => {
        // Extract position and size from style
        const x = Number.parseInt(el.style.left) || 50;
        const y = Number.parseInt(el.style.top) || 50;
        const width = Number.parseInt(el.style.width) || 200;
        const height = Number.parseInt(el.style.height) || 100;

        // Extract background color
        const backgroundColor = el.style.backgroundColor || '#e2e8f0';

        // Extract text content and properties
        const content: Record<string, string> = {};
        const textColor = el.text?.en?.style?.color || '#000000';
        const fontSize = Number.parseInt(el.text?.en?.style?.fontSize) || 16;

        // Add text content for each language
        Object.keys(el.text || {}).forEach(lang => {
          content[lang] = el.text[lang].text || '';
        });

        // Determine element type based on properties
        const type = 'div';

        // Create the element with the application's format
        return {
          id: nanoid(),
          type,
          x,
          y,
          width,
          height,
          widthUnit: 'px',
          heightUnit: 'px',
          backgroundColor,
          borderRadius: 0,
          borderWidth: 0,
          borderColor: '#000000',
          borderStyle: 'solid',
          content,
          zIndex: elements.length,
          fontFamily: 'Inter, sans-serif',
          fontSize,
          fontWeight: 'normal',
          name: el.name || `element_${nanoid(6)}`,
          editable: el.editable !== undefined ? el.editable : true,
          textColor,
          textAlign: 'center',
          verticalAlign: 'middle',
        };
      });

      // Add the new elements to the canvas
      setElements([...elements, ...newElements]);
    } catch (error) {
      console.error('Error importing elements:', error);
      alert('Failed to import elements. Please check the format and try again.');
    }
  };

  // Add export functionality - add these functions before the return statement
  const generateJsonData = () => {
    const jsonData = elements
      .map(el => {
        // Skip grid items as they'll be included in their parent grid
        if (el.type === 'grid-item' && !el.parentId) return null;

        const textEntries: Record<string, any> = {};
        Object.entries(el.content).forEach(([lang, text]) => {
          textEntries[lang] = {
            text: text,
            style: {
              fontSize: `${el.fontSize}px`,
              color: el.textColor ? el.textColor : 'rgba(0, 0, 0, 1)',
            },
          };
        });

        const style: Record<string, any> = {
          display: 'flex',
          justifyContent:
            el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : el.textAlign === 'center' ? 'center' : 'space-between',
          alignItems: el.verticalAlign === 'top' ? 'flex-start' : el.verticalAlign === 'bottom' ? 'flex-end' : 'center',
          position: 'absolute',
          left: `${el.x}${el.xUnit}`,
          top: `${el.y}${el.yUnit}`,
          width: `${el.width}${el.widthUnit}`,
          height: `${el.height}${el.heightUnit}`,
          backgroundColor: el.backgroundColor.startsWith('#')
            ? `rgba(${Number.parseInt(el.backgroundColor.slice(1, 3), 16)}, ${Number.parseInt(el.backgroundColor.slice(3, 5), 16)}, ${Number.parseInt(el.backgroundColor.slice(5, 7), 16)}, 1)`
            : el.backgroundColor,
        };

        // Add border properties if they exist
        if (el.borderWidth > 0) {
          style.borderWidth = `${el.borderWidth}px`;
          style.borderStyle = el.borderStyle;
          style.borderColor = el.borderColor.startsWith('#')
            ? `rgba(${Number.parseInt(el.borderColor.slice(1, 3), 16)}, ${Number.parseInt(el.borderColor.slice(3, 5), 16)}, ${Number.parseInt(el.borderColor.slice(5, 7), 16)}, 1)`
            : el.borderColor;
          style.borderRadius = `${el.borderRadius}px`;
        }

        // Add grid properties if it's a grid
        if (el.type === 'grid') {
          style.display = 'grid';
          style.gridTemplateColumns = `repeat(${el.gridColumns}, 1fr)`;
          style.gridTemplateRows = `repeat(${el.gridRows}, 1fr)`;
          style.gap = `${el.gridGap}px`;
        }

        return {
          name: el.name || `element_${el.id.substring(0, 6)}`,
          editable: el.editable !== undefined ? el.editable : true,
          text: textEntries,
          style: style,
          ...(el.type === 'input' && { inputType: el.inputType }),
          ...(el.type === 'grid' && {
            children: elements
              .filter(item => item.parentId === el.id)
              .map(item => ({
                name: item.name || `grid_item_${item.id.substring(0, 6)}`,
                editable: item.editable !== undefined ? item.editable : true,
                text: Object.entries(item.content).reduce(
                  (acc, [lang, text]) => {
                    acc[lang] = {
                      text: text,
                      style: {
                        fontSize: `${item.fontSize}px`,
                        color: item.textColor ? item.textColor : 'rgba(0, 0, 0, 1)',
                      },
                    };
                    return acc;
                  },
                  {} as Record<string, any>,
                ),
                style: {
                  display: 'flex',
                  justifyContent:
                    item.textAlign === 'left'
                      ? 'flex-start'
                      : item.textAlign === 'right'
                        ? 'flex-end'
                        : item.textAlign === 'center'
                          ? 'center'
                          : 'space-between',
                  alignItems: item.verticalAlign === 'top' ? 'flex-start' : item.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                  gridColumn: `${item.gridColumnStart} / ${item.gridColumnEnd}`,
                  gridRow: `${item.gridRowStart} / ${item.gridRowEnd}`,
                  backgroundColor: item.backgroundColor.startsWith('#')
                    ? `rgba(${Number.parseInt(item.backgroundColor.slice(1, 3), 16)}, ${Number.parseInt(item.backgroundColor.slice(3, 5), 16)}, ${Number.parseInt(item.backgroundColor.slice(5, 7), 16)}, 1)`
                    : item.backgroundColor,
                  borderRadius: `${item.borderRadius}px`,
                  border: `${item.borderWidth}px ${item.borderStyle} ${item.borderColor}`,
                },
              })),
          }),
        };
      })
      .filter(Boolean);

    return JSON.stringify(jsonData, null, 2);
  };

  const generateYamlData = () => {
    // Get the JSON data first
    const jsonData = JSON.parse(generateJsonData());
    let yamlStr = '';

    // Process each element
    jsonData.forEach((el, index) => {
      yamlStr += `- element_${index + 1}:\n`;
      yamlStr += `    name: ${el.name}\n`;
      yamlStr += `    editable: ${el.editable}\n`;

      // Handle text entries
      yamlStr += `    text:\n`;
      Object.entries(el.text).forEach(([lang, textData]) => {
        yamlStr += `      ${lang}:\n`;
        yamlStr += `        text: "${(textData as any).text}"\n`;
        yamlStr += `        style:\n`;
        yamlStr += `          fontSize: "${(textData as any).style.fontSize}"\n`;
        yamlStr += `          color: "${(textData as any).style.color}"\n`;
      });

      // Handle style properties
      yamlStr += `    style:\n`;
      Object.entries(el.style).forEach(([key, value]) => {
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          yamlStr += `      ${key}:\n`;
          Object.entries(value as object).forEach(([subKey, subValue]) => {
            yamlStr += `        ${subKey}: ${subValue}\n`;
          });
        } else {
          yamlStr += `      ${key}: ${value}\n`;
        }
      });

      // Handle input type if present
      if (el.inputType) {
        yamlStr += `    inputType: ${el.inputType}\n`;
      }

      // Handle children if present (for grid elements)
      if (el.children && Array.isArray(el.children)) {
        yamlStr += `    children:\n`;
        el.children.forEach((child, childIndex) => {
          yamlStr += `      - child_${childIndex + 1}:\n`;
          yamlStr += `          name: ${child.name}\n`;
          yamlStr += `          editable: ${child.editable}\n`;

          // Handle child text entries
          yamlStr += `          text:\n`;
          Object.entries(child.text).forEach(([lang, textData]) => {
            yamlStr += `            ${lang}:\n`;
            yamlStr += `              text: "${(textData as any).text}"\n`;
            yamlStr += `              style:\n`;
            yamlStr += `                fontSize: "${(textData as any).style.fontSize}"\n`;
            yamlStr += `                color: "${(textData as any).style.color}"\n`;
          });

          // Handle child style properties
          yamlStr += `          style:\n`;
          Object.entries(child.style).forEach(([key, value]) => {
            yamlStr += `            ${key}: ${value}\n`;
          });
        });
      }

      yamlStr += '\n';
    });

    return yamlStr;
  };

  const generateHtml = () => {
    const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Template</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Inter', sans-serif;
      }
      .container {
        position: relative;
        width: ${getDeviceSize(devicePreset, orientation)?.width}px;
        height: ${getDeviceSize(devicePreset, orientation)?.height}px;
        overflow: hidden;
      }
      ${elements
        .map(el => {
          if (el.type === 'grid-item') return '';
          return `
            #${el.id} {
              position: ${el.type === 'grid-item' ? 'relative' : 'absolute'};
              left: ${el.x}${el.xUnit};
              top: ${el.y}${el.yUnit};
              width: ${el.width}${el.widthUnit};
              height: ${el.height}${el.heightUnit};
              background-color: ${el.backgroundColor};
              ${el.backgroundImage ? `background-image: url(${el.backgroundImage});` : ''}
              ${el.backgroundSize ? `background-size: ${el.backgroundSize};` : ''}
              ${el.backgroundPosition ? `background-position: ${el.backgroundPosition};` : ''}
              ${el.backgroundRepeat ? `background-repeat: ${el.backgroundRepeat};` : ''}
              border-radius: ${el.borderRadius}px;
              border: ${el.borderWidth}px ${el.borderStyle} ${el.borderColor};
              z-index: ${el.zIndex};
              font-family: ${el.fontFamily};
              font-size: ${el.fontSize}px;
              font-weight: ${el.fontWeight};
              color: ${el.textColor || '#000000'};
              display: flex;
              align-items: ${el.verticalAlign === 'top' ? 'flex-start' : el.verticalAlign === 'bottom' ? 'flex-end' : 'center'};
              justify-content: ${el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : el.textAlign === 'center' ? 'center' : 'space-between'};
              ${
                el.type === 'grid'
                  ? `
                display: grid;
                grid-template-columns: repeat(${el.gridColumns}, 1fr);
                grid-template-rows: repeat(${el.gridRows}, 1fr);
                gap: ${el.gridGap}px;
              `
                  : ''
              }
            }
            ${
              el.type === 'input'
                ? `
              #${el.id} input {
                width: 100%;
                height: 100%;
                border: none;
                background: transparent;
                padding: 0 8px;
                font-family: inherit;
                font-size: inherit;
                color: inherit;
              }
            `
                : ''
            }
            ${
              el.type === 'grid'
                ? elements
                    .filter(item => item.parentId === el.id)
                    .map(
                      item => `
                #${item.id} {
                  grid-column: ${item.gridColumnStart} / ${item.gridColumnEnd};
                  grid-row: ${item.gridRowStart} / ${item.gridRowEnd};
                  background-color: ${item.backgroundColor};
                  ${item.backgroundImage ? `background-image: url(${item.backgroundImage});` : ''}
                  ${item.backgroundSize ? `background-size: ${item.backgroundSize};` : ''}
                  ${item.backgroundPosition ? `background-position: ${item.backgroundPosition};` : ''}
                  ${item.backgroundRepeat ? `background-repeat: ${item.backgroundRepeat};` : ''}
                  border-radius: ${item.borderRadius}px;
                  border: ${item.borderWidth}px ${item.borderStyle} ${item.borderColor};
                  font-family: ${item.fontFamily};
                  font-size: ${item.fontSize}px;
                  font-weight: ${item.fontWeight};
                  color: ${item.textColor || '#000000'};
                  display: flex;
                  align-items: ${item.verticalAlign === 'top' ? 'flex-start' : item.verticalAlign === 'bottom' ? 'flex-end' : 'center'};
                  justify-content: ${item.textAlign === 'left' ? 'flex-start' : item.textAlign === 'right' ? 'flex-end' : item.textAlign === 'center' ? 'center' : 'space-between'};
                }
              `,
                    )
                    .join('\n')
                : ''
            }
          `;
        })
        .join('\n')}
    </style>
  </head>
  <body>
    <div class="container">
      ${elements
        .map(el => {
          if (el.type === 'grid-item') return '';
          const content = el.content[currentLanguage] || el.content.en || '';
          if (el.type === 'input') {
            return `<div id="${el.id}"><input type="${el.inputType}" placeholder="${content}"></div>`;
          } else if (el.type === 'grid') {
            const gridItems = elements
              .filter(item => item.parentId === el.id)
              .map(item => `<div id="${item.id}">${item.content[currentLanguage] || item.content.en || ''}</div>`)
              .join('\n');
            return `<div id="${el.id}">${gridItems}</div>`;
          }
          return `<div id="${el.id}">${content}</div>`;
        })
        .join('\n')}
    </div>
  </body>
  </html>
    `;
    return html.trim();
  };

  // Update the exportData function to include React format
  const exportData = (format: 'html' | 'json' | 'yaml' | 'react') => {
    let data = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'html':
        data = generateHtml();
        filename = 'template.html';
        mimeType = 'text/html';
        break;
      case 'json':
        data = generateJsonData();
        filename = 'template.json';
        mimeType = 'application/json';
        break;
      case 'yaml':
        data = generateYamlData();
        filename = 'template.yml';
        mimeType = 'text/yaml';
        break;
      case 'react':
        data = generateReactCode();
        filename = 'TemplateComponent.jsx';
        mimeType = 'text/javascript';
        break;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add this function to generate React component code
  const generateReactCode = () => {
    const imports = `import React from 'react';\n\n`;

    const componentCode = `export default function GeneratedTemplate() {
    return (
      <div className="relative" style={{ width: '${getDeviceSize(devicePreset, orientation)?.width}px', height: '${getDeviceSize(devicePreset, orientation)?.height}px', position: 'relative' }}>
        ${elements
          .map(el => {
            if (el.type === 'grid-item') return ''; // Grid items are rendered within their parent grid

            let style = `position: ${el.type === 'grid-item' ? 'relative' : 'absolute'},`;
            style += `left: ${el.x}${el.xUnit}, top: ${el.y}${el.yUnit},`;
            style += `width: ${el.width}${el.widthUnit || 'px'}, height: ${el.height}${el.heightUnit || 'px'},`;

            if (el.type !== 'grid-item') {
              style += `left: ${el.x}px, top: ${el.y}px,`;
            }

            style += `width: ${el.width}${el.widthUnit || 'px'}, height: ${el.height}${el.heightUnit || 'px'},`;
            style += `backgroundColor: "${el.backgroundColor}",`;
            style += `borderRadius: ${el.borderRadius}px,`;
            style += `border: "${el.borderWidth}px ${el.borderStyle} ${el.borderColor}",`;
            style += `zIndex: ${el.zIndex},`;
            style += `fontFamily: "${el.fontFamily}",`;
            style += `fontSize: ${el.fontSize}px,`;
            style += `fontWeight: "${el.fontWeight}",`;
            style += `color: "${el.textColor || '#000000'}",`;
            style += `textAlign: "${el.textAlign || 'left'}",`;

            // Add background image if it exists
            if (el.backgroundImage) {
              style += `backgroundImage: "url(${el.backgroundImage})",`;
              style += `backgroundSize: "${el.backgroundSize || 'cover'}",`;
              style += `backgroundPosition: "${el.backgroundPosition || 'center'}",`;
              style += `backgroundRepeat: "${el.backgroundRepeat || 'no-repeat'}",`;
            }

            // Add display flex for vertical alignment
            if (el.verticalAlign) {
              style += `display: "flex",`;
              style += `alignItems: "${el.verticalAlign === 'top' ? 'flex-start' : el.verticalAlign === 'bottom' ? 'flex-end' : 'center'}",`;
              style += `justifyContent: "${el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : el.textAlign === 'center' ? 'center' : 'space-between'}",`;
            }

            if (el.type === 'grid') {
              style += `display: "grid",`;
              style += `gridTemplateColumns: "repeat(${el.gridColumns}, 1fr)",`;
              style += `gridTemplateRows: "repeat(${el.gridRows}, 1fr)",`;
              style += `gap: ${el.gridGap}px,`;
            }

            if (el.type === 'grid-item') {
              style += `gridColumn: "${el.gridColumnStart} / ${el.gridColumnEnd}",`;
              style += `gridRow: "${el.gridRowStart} / ${el.gridRowEnd}",`;
            }

            const content = el.content[currentLanguage] || el.content.en || '';

            if (el.type === 'input') {
              return `      <input
              type="${el.inputType}"
              placeholder="${content}"
              style={{ ${style} }}
            />`;
            } else if (el.type === 'button') {
              return `      <button style={{ ${style} }}>
              ${content}
            </button>`;
            } else if (el.type === 'heading') {
              return `      <h2 style={{ ${style} }}>
              ${content}
            </h2>`;
            } else if (el.type === 'paragraph') {
              return `      <p style={{ ${style} }}>
              ${content}
            </p>`;
            } else if (el.type === 'grid') {
              const gridItems = elements
                .filter(item => item.parentId === el.id)
                .map(item => {
                  const itemStyle = `position: "relative", gridColumn: "${item.gridColumnStart} / ${item.gridColumnEnd}", gridRow: "${item.gridRowStart} / ${item.gridRowEnd}", backgroundColor: "${item.backgroundColor}", borderRadius: ${item.borderRadius}px, border: "${item.borderWidth}px ${item.borderStyle} ${item.borderColor}", fontFamily: "${item.fontFamily}", fontSize: ${item.fontSize}px, fontWeight: "${item.fontWeight}", color: "${item.textColor || '#000000'}", display: "flex", alignItems: "${item.verticalAlign === 'top' ? 'flex-start' : item.verticalAlign === 'bottom' ? 'flex-end' : 'center'}", justifyContent: "${item.textAlign === 'left' ? 'flex-start' : item.textAlign === 'right' ? 'flex-end' : item.textAlign === 'center' ? 'center' : 'space-between'}"`;
                  return `        <div key="${item.id}" style={{ ${itemStyle} }}>
                ${item.content[currentLanguage] || item.content.en || ''}
              </div>`;
                })
                .join('\n');

              return `      <div style={{ ${style} }}>
      ${gridItems}
            </div>`;
            } else {
              return `      <div style={{ ${style} }}>
              ${content}
            </div>`;
            }
          })
          .filter(Boolean)
          .join('\n')}
    </div>
  );
}`;

    return imports + componentCode;
  };

  // Add a function to get preview code based on format
  const getPreviewCode = (format: 'html' | 'json' | 'yaml' | 'react') => {
    switch (format) {
      case 'html':
        return generateHtml();
      case 'json':
        return generateJsonData();
      case 'yaml':
        return generateYamlData();
      case 'react':
        return generateReactCode();
      default:
        return '';
    }
  };

  // Add a Media Library Dialog component
  const MediaLibraryDialog = () => {
    return (
      <Dialog open={showMediaUploader} onOpenChange={setShowMediaUploader}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            <div className="p-4">
              <Button onClick={() => fileInputRef.current?.click()} className="mb-4">
                Upload Media
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" className="hidden" multiple />

              {mediaLibrary.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No media uploaded yet. Click "Upload Media" to add images or videos.</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {mediaLibrary.map(media => (
                    <div
                      key={media.id}
                      className="border rounded-md p-2 cursor-pointer hover:bg-accent"
                      onClick={() => {
                        if (selectedElement) {
                          updateElement(selectedElement, {
                            backgroundImage: media.url,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          });
                          setShowMediaUploader(false);
                        }
                      }}
                    >
                      {media.type === 'image' ? (
                        <img src={media.url || '/placeholder.svg'} alt={media.name} className="w-full h-32 object-cover rounded" />
                      ) : (
                        <video src={media.url} className="w-full h-32 object-cover rounded" />
                      )}
                      <p className="mt-2 text-sm truncate">{media.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Add a function to convert hex to rgba
  const hexToRgba = (hex: string, alpha = 1) => {
    // Remove the hash if it exists
    hex = hex.replace('#', '');

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);

    // Return the rgba value
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Add a function to check if a color is transparent
  const isTransparent = (color: string) => {
    return color.startsWith('rgba') && color.endsWith(', 0)');
  };

  // Replace the entire return statement with this updated layout
  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left sidebar - Canvas tools */}
      {showToolsPanel && (
        <div className="w-16 border-r bg-background flex flex-col items-center py-4 gap-4">
          <div className="flex flex-col gap-2 items-center">
            <Button size="icon" variant="outline" onClick={() => handleZoom(zoomLevel + 0.1)} title="Zoom In">
              <Plus className="h-4 w-4" />
            </Button>
            <div className="text-xs font-medium">{Math.round(zoomLevel * 100)}%</div>
            <Button size="icon" variant="outline" onClick={() => handleZoom(zoomLevel - 0.1)} title="Zoom Out">
              <Minus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => handleZoom(1)} title="Reset Zoom">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-t w-full my-2"></div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('div')}
            title="Add Div"
            className="flex flex-col gap-1 h-auto py-2"
            disabled={isPreviewMode}
          >
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs">Div</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('button')}
            title="Add Button"
            className="flex flex-col gap-1 h-auto py-2"
            disabled={isPreviewMode}
          >
            <div className="w-6 h-6 bg-blue-500 rounded"></div>
            <span className="text-xs">Button</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('input')}
            title="Add Input"
            className="flex flex-col gap-1 h-auto py-2"
            disabled={isPreviewMode}
          >
            <div className="w-6 h-6 border border-gray-400 rounded"></div>
            <span className="text-xs">Input</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('heading')}
            title="Add Heading"
            className="flex flex-col gap-1 h-auto py-2"
            disabled={isPreviewMode}
          >
            <div className="w-6 h-6 font-bold flex items-center justify-center">H</div>
            <span className="text-xs">Heading</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('paragraph')}
            title="Add Paragraph"
            className="flex flex-col gap-1 h-auto py-2"
            disabled={isPreviewMode}
          >
            <div className="w-6 h-6 flex items-center justify-center">P</div>
            <span className="text-xs">Para</span>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => addElement('grid')}
            title="Add Grid"
            className="flex flex-col gap-1 h-auto py-2"
            disabled={isPreviewMode}
          >
            <div className="w-6 h-6 grid grid-cols-2 gap-0.5">
              <div className="bg-gray-300"></div>
              <div className="bg-gray-300"></div>
              <div className="bg-gray-300"></div>
              <div className="bg-gray-300"></div>
            </div>
            <span className="text-xs">Grid</span>
          </Button>
        </div>
      )}

      {/* Middle - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Canvas controls */}
        <div className="p-4 border-b flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowToolsPanel(!showToolsPanel)}
              title="Toggle Tools Panel"
              className={cn(showToolsPanel && 'bg-accent')}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
              title="Toggle Properties Panel"
              className={cn(showPropertiesPanel && 'bg-accent')}
            >
              <PanelRight className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsPreviewMode(!isPreviewMode);
                if (!isPreviewMode) {
                  setSelectedElement(null);
                }
              }}
              title={isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
              className={cn(isPreviewMode && 'bg-accent')}
            >
              <Eye className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mr-4">
            <Label htmlFor="device-preset">Device:</Label>
            <Select value={devicePreset} onValueChange={setDevicePreset}>
              <SelectTrigger id="device-preset" className="w-[120px]">
                <SelectValue placeholder="Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tv">TV</SelectItem>
                <SelectItem value="kiosk">Kiosk</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mr-4">
            <Label htmlFor="orientation">Orientation:</Label>
            <Select
              value={orientation}
              onValueChange={setOrientation}
              disabled={devicePreset === 'tv' || devicePreset === 'monitor' || devicePreset === 'desktop'}
            >
              <SelectTrigger id="orientation" className="w-[120px]">
                <SelectValue placeholder="Orientation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* <div className="flex items-center gap-2 mr-4">
            <Label htmlFor="wireframe" className="cursor-pointer">
              Wireframe:
            </Label>
            <Switch
              id="wireframe"
              checked={showWireframe}
              onCheckedChange={setShowWireframe}
            />
          </div> */}

          <div className="flex items-center gap-2 mr-4">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0 || isPreviewMode}>
              Undo
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1 || isPreviewMode}>
              Redo
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditableHtml(generateHtml());
                    setIsEditingHtml(false);
                    setShowCode(true);
                    setPreviewFormat('html');
                  }}
                >
                  <Code className="h-4 w-4 mr-2" />
                  View Code
                </Button>
              </DialogTrigger>
              {/* Dialog content */}
              <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Code Preview</span>
                      <Select value={previewFormat} onValueChange={value => setPreviewFormat(value as any)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="react">React</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="yaml">YAML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {previewFormat === 'html' && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingHtml(!isEditingHtml)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditingHtml ? 'View Only' : 'Edit HTML'}
                      </Button>
                    )}
                  </DialogTitle>
                </DialogHeader>
                <div className="overflow-auto">
                  <CodeEditor
                    code={getPreviewCode(previewFormat)}
                    onChange={previewFormat === 'html' ? setEditableHtml : undefined}
                    readOnly={previewFormat !== 'html' || !isEditingHtml}
                    language={previewFormat}
                  />
                </div>
                <DialogFooter>
                  {previewFormat === 'html' && isEditingHtml && (
                    <Button
                      onClick={() => {
                        // Here you would parse the HTML and update the elements
                        // This is a simplified implementation
                        alert('HTML changes applied! (Note: Full HTML parsing would require additional implementation)');
                      }}
                    >
                      Apply Changes
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(getPreviewCode(previewFormat));
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" onClick={() => exportData(previewFormat)}>
                    Export {previewFormat.toUpperCase()}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} disabled={isPreviewMode}>
                Import
              </Button>
              <div className="relative">
                <Select onValueChange={value => exportData(value as 'html' | 'json' | 'yaml' | 'react')}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex justify-center items-center overflow-auto p-4 bg-gray-50">
          {/* <DeviceFrame
            deviceType={
              getDeviceSize(devicePreset, orientation)?.type || "desktop"
            }
            orientation={orientation}
          ></DeviceFrame> */}
          <div
            ref={canvasRef}
            className="relative bg-white overflow-auto border"
            style={{
              width: `${getDeviceSize(devicePreset, orientation)?.width}px`,
              height: `${getDeviceSize(devicePreset, orientation)?.height}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {elements.map(element => {
              // Skip grid items as they're rendered within their parent grid
              if (element.type === 'grid-item' && !selectedElement) return null;

              // For grid elements, calculate the positions of child items
              const isGrid = element.type === 'grid';
              const gridItems = isGrid ? elements.filter(el => el.parentId === element.id) : [];

              // Create the style object with units and background image support
              const elementStyle: React.CSSProperties = {
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}${element.widthUnit || 'px'}`,
                height: `${element.height}${element.heightUnit || 'px'}`,
                backgroundColor: element.backgroundColor,
                borderRadius: `${element.borderRadius}px`,
                border: `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}`,
                zIndex: element.zIndex,
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
                fontWeight: element.fontWeight,
                color: element.textColor || '#000000',
                display: 'flex',
                alignItems: element.verticalAlign === 'top' ? 'flex-start' : element.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                justifyContent:
                  element.textAlign === 'left'
                    ? 'flex-start'
                    : element.textAlign === 'right'
                      ? 'flex-end'
                      : element.textAlign === 'center'
                        ? 'center'
                        : 'space-between',
              };

              // Add background image if it exists
              if (element.backgroundImage) {
                elementStyle.backgroundImage = `url(${element.backgroundImage})`;
                elementStyle.backgroundSize = element.backgroundSize || 'cover';
                elementStyle.backgroundPosition = element.backgroundPosition || 'center';
                elementStyle.backgroundRepeat = element.backgroundRepeat || 'no-repeat';
              }

              // For grid elements
              if (isGrid) {
                elementStyle.display = 'grid';
                elementStyle.gridTemplateColumns = `repeat(${element.gridColumns}, 1fr)`;
                elementStyle.gridTemplateRows = `repeat(${element.gridRows}, 1fr)`;
                elementStyle.gap = `${element.gridGap}px`;
              }

              return (
                <div
                  key={element.id}
                  className={cn(
                    'absolute',
                    !isPreviewMode && 'cursor-move',
                    selectedElement === element.id && !isPreviewMode && 'ring-2 ring-primary ring-offset-2',
                  )}
                  style={elementStyle}
                  onMouseDown={e => !isPreviewMode && element.type !== 'grid-item' && handleMouseDown(e, element.id)}
                >
                  {element.type === 'input' ? (
                    <input
                      type={element.inputType}
                      placeholder={element.content[currentLanguage] || element.content.en || ''}
                      className="w-full h-full px-3 bg-transparent outline-none"
                      readOnly
                      onClick={e => e.stopPropagation()}
                    />
                  ) : isGrid ? (
                    // Render grid items
                    gridItems.map(item => {
                      // Create grid item style with units and background image support
                      const gridItemStyle: React.CSSProperties = {
                        gridColumn: `${item.gridColumnStart} / ${item.gridColumnEnd}`,
                        gridRow: `${item.gridRowStart} / ${item.gridRowEnd}`,
                        backgroundColor: item.backgroundColor,
                        borderRadius: `${item.borderRadius}px`,
                        border: `${item.borderWidth}px ${item.borderStyle} ${item.borderColor}`,
                        fontFamily: item.fontFamily,
                        fontSize: `${item.fontSize}px`,
                        fontWeight: item.fontWeight,
                        color: item.textColor || '#000000',
                        display: 'flex',
                        alignItems: item.verticalAlign === 'top' ? 'flex-start' : item.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                        justifyContent:
                          item.textAlign === 'left'
                            ? 'flex-start'
                            : item.textAlign === 'right'
                              ? 'flex-end'
                              : item.textAlign === 'center'
                                ? 'center'
                                : 'space-between',
                      };

                      // Add background image if it exists
                      if (item.backgroundImage) {
                        gridItemStyle.backgroundImage = `url(${item.backgroundImage})`;
                        gridItemStyle.backgroundSize = item.backgroundSize || 'cover';
                        gridItemStyle.backgroundPosition = item.backgroundPosition || 'center';
                        gridItemStyle.backgroundRepeat = item.backgroundRepeat || 'no-repeat';
                      }

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-center justify-center',
                            selectedElement === item.id && !isPreviewMode && 'ring-2 ring-primary ring-offset-2',
                          )}
                          style={gridItemStyle}
                          onClick={e => {
                            if (isPreviewMode) return;
                            e.stopPropagation();
                            setSelectedElement(item.id);
                          }}
                        >
                          {item.content[currentLanguage] || item.content.en || ''}
                        </div>
                      );
                    })
                  ) : (
                    element.content[currentLanguage] || element.content.en || ''
                  )}

                  {selectedElement === element.id && !isPreviewMode && (
                    <div className="absolute -top-10 right-0 flex gap-1 bg-background p-1 rounded shadow-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => {
                          e.stopPropagation();
                          duplicateElement(element.id);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={e => {
                          e.stopPropagation();
                          removeElement(element.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right sidebar - Properties */}
      {showPropertiesPanel && (
        <div className="w-80 border-l bg-background">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Properties</h2>
          </div>
          {selectedElementData && !isPreviewMode ? (
            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
              <Tabs defaultValue="position">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="position">Position</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="position" className="space-y-4">
                  {/* Position controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="x">X Position</Label>
                      <div className="flex gap-2">
                        <Input
                          id="x"
                          type="number"
                          value={selectedElementData.x}
                          onChange={e =>
                            updateElement(selectedElement, {
                              x: Number(e.target.value),
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                          className="flex-1"
                        />
                        <Select
                          value={selectedElementData.xUnit || 'px'}
                          onValueChange={value =>
                            updateElement(selectedElement, {
                              xUnit: value as 'px' | '%',
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                        >
                          <SelectTrigger className="w-[60px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="px">px</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="y">Y Position</Label>
                      <div className="flex gap-2">
                        <Input
                          id="y"
                          type="number"
                          value={selectedElementData.y}
                          onChange={e =>
                            updateElement(selectedElement, {
                              y: Number(e.target.value),
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                          className="flex-1"
                        />
                        <Select
                          value={selectedElementData.yUnit || 'px'}
                          onValueChange={value =>
                            updateElement(selectedElement, {
                              yUnit: value as 'px' | '%',
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                        >
                          <SelectTrigger className="w-[60px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="px">px</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width">Width</Label>
                      <div className="flex gap-2">
                        <Input
                          id="width"
                          type="number"
                          value={selectedElementData.width}
                          onChange={e =>
                            updateElement(selectedElement, {
                              width: Number(e.target.value),
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                          className="flex-1"
                        />
                        <Select
                          value={selectedElementData.widthUnit || 'px'}
                          onValueChange={value =>
                            updateElement(selectedElement, {
                              widthUnit: value as 'px' | '%',
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                        >
                          <SelectTrigger className="w-[60px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="px">px</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <div className="flex gap-2">
                        <Input
                          id="height"
                          type="number"
                          value={selectedElementData.height}
                          onChange={e =>
                            updateElement(selectedElement, {
                              height: Number(e.target.value),
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                          className="flex-1"
                        />
                        <Select
                          value={selectedElementData.heightUnit || 'px'}
                          onValueChange={value =>
                            updateElement(selectedElement, {
                              heightUnit: value as 'px' | '%',
                            })
                          }
                          disabled={selectedElementData.type === 'grid-item'}
                        >
                          <SelectTrigger className="w-[60px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="px">px</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zIndex">Z-Index</Label>
                    <Input
                      id="zIndex"
                      type="number"
                      value={selectedElementData.zIndex}
                      onChange={e =>
                        updateElement(selectedElement, {
                          zIndex: Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  {selectedElementData.type === 'grid-item' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gridColumnStart">Grid Column Start</Label>
                          <Input
                            id="gridColumnStart"
                            type="number"
                            value={selectedElementData.gridColumnStart}
                            onChange={e =>
                              updateElement(selectedElement, {
                                gridColumnStart: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gridColumnEnd">Grid Column End</Label>
                          <Input
                            id="gridColumnEnd"
                            type="number"
                            value={selectedElementData.gridColumnEnd}
                            onChange={e =>
                              updateElement(selectedElement, {
                                gridColumnEnd: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gridRowStart">Grid Row Start</Label>
                          <Input
                            id="gridRowStart"
                            type="number"
                            value={selectedElementData.gridRowStart}
                            onChange={e =>
                              updateElement(selectedElement, {
                                gridRowStart: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gridRowEnd">Grid Row End</Label>
                          <Input
                            id="gridRowEnd"
                            type="number"
                            value={selectedElementData.gridRowEnd}
                            onChange={e =>
                              updateElement(selectedElement, {
                                gridRowEnd: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElementData.type === 'grid' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="gridColumns">Grid Columns</Label>
                          <Input
                            id="gridColumns"
                            type="number"
                            value={selectedElementData.gridColumns}
                            onChange={e =>
                              updateElement(selectedElement, {
                                gridColumns: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gridRows">Grid Rows</Label>
                          <Input
                            id="gridRows"
                            type="number"
                            value={selectedElementData.gridRows}
                            onChange={e =>
                              updateElement(selectedElement, {
                                gridRows: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gridGap">Grid Gap</Label>
                        <Input
                          id="gridGap"
                          type="number"
                          value={selectedElementData.gridGap}
                          onChange={e =>
                            updateElement(selectedElement, {
                              gridGap: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  {/* Style controls */}
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <TransparentColorPicker
                      color={selectedElementData.backgroundColor}
                      onChange={color =>
                        updateElement(selectedElement, {
                          backgroundColor: color,
                        })
                      }
                    />
                  </div>

                  {/* Add background image controls */}
                  <div className="space-y-2">
                    <Label>Background Image</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowMediaUploader(true)}>
                        {selectedElementData.backgroundImage ? 'Change Image' : 'Add Image'}
                      </Button>
                      {selectedElementData.backgroundImage && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            updateElement(selectedElement, {
                              backgroundImage: undefined,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {selectedElementData.backgroundImage && (
                      <div className="mt-2 space-y-2">
                        <div className="space-y-2">
                          <Label htmlFor="backgroundSize">Background Size</Label>
                          <Select
                            value={selectedElementData.backgroundSize || 'cover'}
                            onValueChange={value =>
                              updateElement(selectedElement, {
                                backgroundSize: value,
                              })
                            }
                          >
                            <SelectTrigger id="backgroundSize">
                              <SelectValue placeholder="Select background size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cover">Cover</SelectItem>
                              <SelectItem value="contain">Contain</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="100% 100%">Stretch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="backgroundPosition">Background Position</Label>
                          <Select
                            value={selectedElementData.backgroundPosition || 'center'}
                            onValueChange={value =>
                              updateElement(selectedElement, {
                                backgroundPosition: value,
                              })
                            }
                          >
                            <SelectTrigger id="backgroundPosition">
                              <SelectValue placeholder="Select background position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="top left">Top Left</SelectItem>
                              <SelectItem value="top right">Top Right</SelectItem>
                              <SelectItem value="bottom left">Bottom Left</SelectItem>
                              <SelectItem value="bottom right">Bottom Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="backgroundRepeat">Background Repeat</Label>
                          <Select
                            value={selectedElementData.backgroundRepeat || 'no-repeat'}
                            onValueChange={value =>
                              updateElement(selectedElement, {
                                backgroundRepeat: value,
                              })
                            }
                          >
                            <SelectTrigger id="backgroundRepeat">
                              <SelectValue placeholder="Select background repeat" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-repeat">No Repeat</SelectItem>
                              <SelectItem value="repeat">Repeat</SelectItem>
                              <SelectItem value="repeat-x">Repeat X</SelectItem>
                              <SelectItem value="repeat-y">Repeat Y</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="borderRadius">Border Radius</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="borderRadius"
                        min={0}
                        max={50}
                        step={1}
                        value={[selectedElementData.borderRadius]}
                        onValueChange={([value]) =>
                          updateElement(selectedElement, {
                            borderRadius: value,
                          })
                        }
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{selectedElementData.borderRadius}px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="borderWidth">Border Width</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="borderWidth"
                        min={0}
                        max={10}
                        step={1}
                        value={[selectedElementData.borderWidth]}
                        onValueChange={([value]) => updateElement(selectedElement, { borderWidth: value })}
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{selectedElementData.borderWidth}px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Border Color</Label>
                    <TransparentColorPicker
                      color={selectedElementData.borderColor}
                      onChange={color => updateElement(selectedElement, { borderColor: color })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="borderStyle">Border Style</Label>
                    <Select value={selectedElementData.borderStyle} onValueChange={value => updateElement(selectedElement, { borderStyle: value })}>
                      <SelectTrigger id="borderStyle">
                        <SelectValue placeholder="Select border style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-4">
                  {/* Text controls */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="language">Language</Label>
                      <Button variant="outline" size="sm" onClick={addLanguage}>
                        Add Language
                      </Button>
                    </div>
                    <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang} value={lang}>
                            {lang.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Text Content ({currentLanguage.toUpperCase()})</Label>
                    <Input
                      id="content"
                      value={selectedElementData.content[currentLanguage] || ''}
                      onChange={e => {
                        const updatedContent = {
                          ...selectedElementData.content,
                        };
                        updatedContent[currentLanguage] = e.target.value;
                        updateElement(selectedElement, {
                          content: updatedContent,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <TransparentColorPicker
                      color={selectedElementData.textColor || '#000000'}
                      onChange={color => updateElement(selectedElement, { textColor: color })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Text Alignment</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedElementData.textAlign === 'left' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => updateElement(selectedElement, { textAlign: 'left' })}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.textAlign === 'center' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() =>
                          updateElement(selectedElement, {
                            textAlign: 'center',
                          })
                        }
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.textAlign === 'right' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => updateElement(selectedElement, { textAlign: 'right' })}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.textAlign === 'justify' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() =>
                          updateElement(selectedElement, {
                            textAlign: 'justify',
                          })
                        }
                      >
                        <AlignJustify className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vertical Alignment</Label>
                    <Select
                      value={selectedElementData.verticalAlign || 'middle'}
                      onValueChange={value =>
                        updateElement(selectedElement, {
                          verticalAlign: value as 'top' | 'middle' | 'bottom',
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vertical alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="middle">Middle</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select value={selectedElementData.fontFamily} onValueChange={value => updateElement(selectedElement, { fontFamily: value })}>
                      <SelectTrigger id="fontFamily">
                        <SelectValue placeholder="Select font family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                        <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                        <SelectItem value="Georgia, serif">Georgia</SelectItem>
                        <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                        <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                        <SelectItem value="Impact, sans-serif">Impact</SelectItem>
                        <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                        <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                        <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                        <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                        <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="fontSize"
                        min={8}
                        max={72}
                        step={1}
                        value={[selectedElementData.fontSize]}
                        onValueChange={([value]) => updateElement(selectedElement, { fontSize: value })}
                        className="flex-1"
                      />
                      <span className="w-10 text-right">{selectedElementData.fontSize}px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontWeight">Font Weight</Label>
                    <Select value={selectedElementData.fontWeight} onValueChange={value => updateElement(selectedElement, { fontWeight: value })}>
                      <SelectTrigger id="fontWeight">
                        <SelectValue placeholder="Select font weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="lighter">Lighter</SelectItem>
                        <SelectItem value="bolder">Bolder</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="600">600</SelectItem>
                        <SelectItem value="700">700</SelectItem>
                        <SelectItem value="800">800</SelectItem>
                        <SelectItem value="900">900</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  {/* Advanced controls */}
                  <div className="space-y-2">
                    <Label htmlFor="elementName">Element Name</Label>
                    <Input
                      id="elementName"
                      type="text"
                      value={selectedElementData.name || ''}
                      onChange={e => updateElement(selectedElement, { name: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="editable">Editable</Label>
                    <Switch
                      id="editable"
                      checked={selectedElementData.editable}
                      onCheckedChange={checked => updateElement(selectedElement, { editable: checked })}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="p-4 text-muted-foreground">
              {isPreviewMode ? 'Preview mode active. Select an element to edit.' : 'Select an element to see its properties.'}
            </div>
          )}
        </div>
      )}

      <MediaLibraryDialog />
      {/* Add the MediaUploader component */}
      <MediaUploader
        open={showMediaUploader}
        onOpenChange={setShowMediaUploader}
        onSelect={media => {
          if (selectedElement) {
            updateElement(selectedElement, {
              backgroundImage: media.url,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            });
          }
        }}
        mediaLibrary={mediaLibrary}
        onUpload={newMedia => setMediaLibrary([...mediaLibrary, ...newMedia])}
      />
      <ImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} onImport={handleImportElements} />
    </div>
  );
}
