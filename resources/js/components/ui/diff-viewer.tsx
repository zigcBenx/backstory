import React from 'react';
import { diffLines, diffWordsWithSpace, Change } from 'diff';

interface DiffViewerProps {
    before: string;
    after: string;
    fileName?: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ before, after, fileName }) => {
    const changes = diffLines(before, after);

    // Process changes to group added/removed lines and apply word-level diff
    const processedChanges: Array<{
        type: 'unchanged' | 'modified' | 'added' | 'removed';
        beforeLines?: string[];
        afterLines?: string[];
        lines?: string[];
    }> = [];

    let i = 0;
    while (i < changes.length) {
        const change = changes[i];

        if (!change.added && !change.removed) {
            // Unchanged content
            processedChanges.push({
                type: 'unchanged',
                lines: change.value.split('\n').filter((line, idx, arr) =>
                    !(idx === arr.length - 1 && line === '')
                )
            });
            i++;
        } else if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
            // Modified content (removed followed by added)
            const removedLines = change.value.split('\n').filter((line, idx, arr) =>
                !(idx === arr.length - 1 && line === '')
            );
            const addedLines = changes[i + 1].value.split('\n').filter((line, idx, arr) =>
                !(idx === arr.length - 1 && line === '')
            );

            processedChanges.push({
                type: 'modified',
                beforeLines: removedLines,
                afterLines: addedLines
            });
            i += 2;
        } else if (change.removed) {
            // Pure removal
            processedChanges.push({
                type: 'removed',
                lines: change.value.split('\n').filter((line, idx, arr) =>
                    !(idx === arr.length - 1 && line === '')
                )
            });
            i++;
        } else if (change.added) {
            // Pure addition
            processedChanges.push({
                type: 'added',
                lines: change.value.split('\n').filter((line, idx, arr) =>
                    !(idx === arr.length - 1 && line === '')
                )
            });
            i++;
        }
    }

    const renderInlineChanges = (beforeText: string, afterText: string) => {
        const wordDiff = diffWordsWithSpace(beforeText, afterText);

        return (
            <div className="flex flex-col">
                {/* Before line with word-level highlighting */}
                <div className="flex items-start bg-red-500/10 border-l-2 border-red-500/50">
                    <div className="w-8 text-center text-red-300 bg-red-500/20 border-r border-border/20 py-1">-</div>
                    <div className="flex-1 px-3 py-1 font-mono text-xs text-red-300 whitespace-pre-wrap break-all">
                        {wordDiff.map((part, idx) =>
                            part.removed ? (
                                <span key={idx} className="bg-red-500/30 text-red-200">{part.value}</span>
                            ) : !part.added ? (
                                <span key={idx}>{part.value}</span>
                            ) : null
                        )}
                    </div>
                </div>

                {/* After line with word-level highlighting */}
                <div className="flex items-start bg-green-500/10 border-l-2 border-green-500/50">
                    <div className="w-8 text-center text-green-300 bg-green-500/20 border-r border-border/20 py-1">+</div>
                    <div className="flex-1 px-3 py-1 font-mono text-xs text-green-300 whitespace-pre-wrap break-all">
                        {wordDiff.map((part, idx) =>
                            part.added ? (
                                <span key={idx} className="bg-green-500/30 text-green-200">{part.value}</span>
                            ) : !part.removed ? (
                                <span key={idx}>{part.value}</span>
                            ) : null
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderSimpleLine = (line: string, type: 'added' | 'removed' | 'unchanged') => {
        const lineNumber = type === 'added' ? '+' : type === 'removed' ? '-' : ' ';
        const bgColor = type === 'added'
            ? 'bg-green-500/10 border-l-2 border-green-500/50'
            : type === 'removed'
            ? 'bg-red-500/10 border-l-2 border-red-500/50'
            : 'bg-background';

        const textColor = type === 'added'
            ? 'text-green-300'
            : type === 'removed'
            ? 'text-red-300'
            : 'text-foreground';

        const numberBg = type === 'added'
            ? 'bg-green-500/20'
            : type === 'removed'
            ? 'bg-red-500/20'
            : 'bg-muted/20';

        return (
            <div className={`flex items-start font-mono text-xs ${bgColor}`}>
                <div className={`w-8 text-center ${textColor} ${numberBg} border-r border-border/20 py-1`}>
                    {lineNumber}
                </div>
                <div className={`flex-1 px-3 py-1 whitespace-pre-wrap break-all ${textColor}`}>
                    {line || ' '}
                </div>
            </div>
        );
    };

    return (
        <div className="border border-border/20 rounded-lg overflow-hidden bg-card">
            {fileName && (
                <div className="bg-muted/30 border-b border-border/20 px-4 py-2">
                    <span className="text-sm font-medium text-foreground">{fileName}</span>
                </div>
            )}
            <div className="max-h-96 overflow-y-auto">
                {processedChanges.map((change, index) => (
                    <div key={index}>
                        {change.type === 'unchanged' && change.lines?.map((line, lineIndex) => (
                            <div key={lineIndex}>{renderSimpleLine(line, 'unchanged')}</div>
                        ))}

                        {change.type === 'added' && change.lines?.map((line, lineIndex) => (
                            <div key={lineIndex}>{renderSimpleLine(line, 'added')}</div>
                        ))}

                        {change.type === 'removed' && change.lines?.map((line, lineIndex) => (
                            <div key={lineIndex}>{renderSimpleLine(line, 'removed')}</div>
                        ))}

                        {change.type === 'modified' && change.beforeLines && change.afterLines && (
                            <>
                                {change.beforeLines.map((beforeLine, lineIndex) => {
                                    const afterLine = change.afterLines?.[lineIndex];
                                    if (afterLine !== undefined) {
                                        // Show word-level diff for modified lines
                                        return (
                                            <div key={lineIndex}>
                                                {renderInlineChanges(beforeLine, afterLine)}
                                            </div>
                                        );
                                    } else {
                                        // Pure removal
                                        return (
                                            <div key={lineIndex}>{renderSimpleLine(beforeLine, 'removed')}</div>
                                        );
                                    }
                                })}
                                {/* Handle extra added lines */}
                                {change.afterLines.slice(change.beforeLines.length).map((line, lineIndex) => (
                                    <div key={`extra-${lineIndex}`}>{renderSimpleLine(line, 'added')}</div>
                                ))}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiffViewer;