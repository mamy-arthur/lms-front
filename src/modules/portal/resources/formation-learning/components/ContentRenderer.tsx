import type { CourseContent } from '../lib/types';
import TextMediaRenderer from './renderers/TextMediaRenderer';
import PageRenderer from './renderers/PageRenderer';
import FileRenderer from './renderers/FileRenderer';
import UrlRenderer from './renderers/UrlRenderer';
import ScormRenderer from './renderers/ScormRenderer';
import SurveyRenderer from './renderers/SurveyRenderer';
import FolderRenderer from './renderers/FolderRenderer';

export default function ContentRenderer({ content }: { content: CourseContent }) {
  switch (content.type) {
    case 'text-media':
      return <TextMediaRenderer content={content} />;
    case 'page':
      return <PageRenderer content={content} />;
    case 'file':
      return <FileRenderer content={content} />;
    case 'url':
      return <UrlRenderer content={content} />;
    case 'scorm':
      return <ScormRenderer content={content} />;
    case 'survey':
      return <SurveyRenderer />;
    case 'folder':
      return <FolderRenderer />;
    default:
      return <p className="text-slate-400 italic">Type de contenu non supporté.</p>;
  }
}
