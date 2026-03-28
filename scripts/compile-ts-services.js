/**
 * 编译TypeScript服务文件为JavaScript
 * 用于Docker生产环境
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 需要编译的TypeScript服务文件
const tsServices = [
  'src/services/chunked-upload.service.ts',
  'src/services/import-queue.service.ts',
  'src/services/error-logger.service.ts',
  'src/services/image-processor.service.ts',
  'src/services/web-conversion.service.ts'
];

console.log('开始编译TypeScript服务文件...\n');

for (const tsFile of tsServices) {
  try {
    const tsPath = resolve(__dirname, '..', tsFile);
    const jsPath = tsPath.replace('.ts', '.js');
    
    // 读取TypeScript文件
    let content = readFileSync(tsPath, 'utf-8');
    
    // 简单的转换：移除类型注解和接口定义
    // 注意：这是一个简化的转换，不处理复杂的TypeScript特性
    
    // 移除导入语句中的类型导入
    content = content.replace(/import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, '');
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+(['"][^'"]+['"])/g, (match, imports, from) => {
      // 移除类型导入
      const cleanImports = imports
        .split(',')
        .map(i => i.trim())
        .filter(i => !i.startsWith('type '))
        .join(', ');
      return cleanImports ? `import { ${cleanImports} } from ${from}` : '';
    });
    
    // 移除接口定义
    content = content.replace(/export\s+interface\s+\w+\s*\{[^}]*\}/gs, '');
    content = content.replace(/interface\s+\w+\s*\{[^}]*\}/gs, '');
    
    // 移除类型别名
    content = content.replace(/export\s+type\s+\w+\s*=\s*[^;]+;/g, '');
    content = content.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');
    
    // 移除函数参数和返回值的类型注解
    content = content.replace(/(\w+)\s*:\s*[^,)=]+/g, '$1');
    content = content.replace(/\)\s*:\s*[^{]+\{/g, ') {');
    
    // 移除变量声明的类型注解
    content = content.replace(/(const|let|var)\s+(\w+)\s*:\s*[^=]+=/g, '$1 $2 =');
    
    // 移除类属性的类型注解
    content = content.replace(/(private|public|protected)?\s*(\w+)\s*:\s*[^;=]+;/g, '$2;');
    content = content.replace(/(private|public|protected)?\s*(\w+)\s*:\s*[^;=]+=\s*/g, '$2 = ');
    
    // 移除泛型
    content = content.replace(/<[^>]+>/g, '');
    
    // 移除 as 类型断言
    content = content.replace(/\s+as\s+\w+/g, '');
    
    // 清理多余的空行
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    // 写入JavaScript文件
    writeFileSync(jsPath, content, 'utf-8');
    
    console.log(`✓ ${tsFile} -> ${jsPath}`);
  } catch (error) {
    console.error(`✗ 编译 ${tsFile} 失败:`, error.message);
    process.exit(1);
  }
}

console.log('\n编译完成！');
