import { htmlToPdfmake } from './htmlToPdfmakeConverter/htmlToPdfmakeConverter';
import { marked } from 'marked';

module.exports = (element, window) => {
    return convertHtmlToPdf = (element) => {
        const mdToHtml = marked(element);
        const htmlToPdf = htmlToPdfmake(mdToHtml, window);
        return htmlToPdf;
    };
};
