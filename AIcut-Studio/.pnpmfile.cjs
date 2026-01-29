function readPackage(pkg, context) {
  // 将 @opencut/* 的依赖指向本地 workspace 包
  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach(dep => {
      if (dep.startsWith('@opencut/')) {
        pkg.dependencies[dep] = 'workspace:*'
      }
    })
  }
  
  if (pkg.devDependencies) {
    Object.keys(pkg.devDependencies).forEach(dep => {
      if (dep.startsWith('@opencut/')) {
        pkg.devDependencies[dep] = 'workspace:*'
      }
    })
  }
  
  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
