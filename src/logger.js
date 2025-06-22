
export class Logger{
    static logError(error, context = ''){
        console.error(`Error in ${context}:`, error);
    }
}