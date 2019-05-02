import { htmlToPdfmake } from './htmlToPdfmakeConverter/htmlToPdfmakeConverter';
import { marked } from 'marked';

module.exports = (element) => {
    let convertMarkdownToHtml = (element) => {
        return marked(element)
    };

    let convertHtmlToPdf = (element) => {
        const mdToHtml = convertMarkdownToHtml(element);
        const htmlToPdf = htmlToPdfmake(mdToHtml);
        return htmlToPdf;
    };

    return convertHtmlToPdf;
};
