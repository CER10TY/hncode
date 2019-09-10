import { getTrending } from './api';
import { head, article, selfPost, tail } from './templates';
import * as vscode from 'vscode';
import { timingSafeEqual } from 'crypto';

let stylesheetPath: vscode.Uri;

export function createFrontView() {
    return new Promise<string>((resolve, reject) => {
        getTrending().then(response => {
            let html: string = head(stylesheetPath);
            for (let item in response) {
                let humanTime = convertTime(response[item].time);

                let linkRe = new RegExp('\/\/([a-zA-Z\.0-9\-\_]*)\/', 'm');
                let url = response[item].url;
                if (url) {
                    // External post
                    let links = url.match(linkRe);
                    if (links) {
                        url = links[1];
                    }
                    html += article(item, response[item], humanTime, url);
                } else if (response[item].id && !url) {
                    // Self post
                    html += selfPost(item, response[item], humanTime);
                }
            }
            html += tail();
            resolve(html);
        });
    });
}

export function setStylesheetPath(path: vscode.Uri) {
    stylesheetPath = path;
}

function convertTime(createTime: number) {
    let humanTime: string | number;
    // HN API provides time in seconds; JS wants it in milliseconds
    let createdTime: Date = new Date(createTime * 1000);
    // Divide back to seconds
    humanTime = (Date.now() - createdTime.getDate()) / 1000;

    // Now we technically need to go from minutes up till years, checking if > every time
    // According to this: https://stackoverflow.com/questions/6665997/switch-statement-for-greater-than-less-than if statements are the fastes way
    // So we trust blessed SO
    let unit: string = '';

    if (humanTime > 3.154 * Math.pow(10, 7)) {
        humanTime /= 3.154 * Math.pow(10, 7);
        unit = ' years';
    } else if (humanTime > 2.592 * Math.pow(10, 6)) {
        humanTime /= 2.592 * Math.pow(10, 6);
        unit = ' months';
    } else if (humanTime > 86400) {
        humanTime /= 86400;
        unit = ' days';
    } else if (humanTime > 3600) {
        humanTime /= 3600;
        unit = ' hours';
    } else if (humanTime > 60) {
        humanTime /= 60;
        unit = ' seconds';
    }

    humanTime = Math.floor(humanTime).toString();
    humanTime += unit;

    return humanTime;
}