import { JPathSegment, JSDPInstruction } from "../base/i-base";

export class JSDPEngine {
    /**
     * Semantic Resolver: Navigates through Objects and Arrays (Mid-path)
     */
    static resolve(data: any, path: JPathSegment[]): { parent: any, key: string | number, target: any } {
        let current = data;
        let parent = null;
        let lastKey: string | number = null;

        for (let i = 0; i < path.length; i++) {
            const segment = path[i];
            parent = current;

            if (typeof segment === 'object' && segment !== null) {
                // MID-PATH ARRAY PIVOT
                if (!Array.isArray(current)) throw new Error(`JSDP Error: Expected array at segment ${i}`);
                
                const idx = current.findIndex(item => item[segment.field] === segment.value);
                if (idx === -1) throw new Error(`JSDP Error: Item not found where ${segment.field} = ${segment.value}`);
                
                lastKey = idx;
                current = current[idx];
            } else {
                // OBJECT KEY TRAVERSAL
                lastKey = segment as string | number;
                current = current[lastKey];
            }
        }
        return { parent, key: lastKey, target: current };
    }

    static apply(data: any, instruction: JSDPInstruction): any {
        const { parent, key, target } = this.resolve(data, instruction.path);

        switch (instruction.action) {
            case 'update':
                parent[key] = instruction.value;
                break;
            case 'delete':
                Array.isArray(parent) ? parent.splice(key as number, 1) : delete parent[key];
                break;
            // Additional 'upsert' logic for the POC can be added here
        }
        return data;
    }
}