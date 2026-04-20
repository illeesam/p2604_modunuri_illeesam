import os, re

ROOT = "c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi/src/main"
JAVA_BASE = f"{ROOT}/java/com/shopjoy/ecadminapi"
MAPPER_BASE = f"{ROOT}/resources/mapper/base"
PKG_ROOT = "com.shopjoy.ecadminapi"

DOMAINS = {
    'ec/cm': {'pkg': f'{PKG_ROOT}.base.ec.cm', 'url': '/api/base/ec/cm', 'dom_prefixes': ['Cmh','Cm']},
    'ec/dp': {'pkg': f'{PKG_ROOT}.base.ec.dp', 'url': '/api/base/ec/dp', 'dom_prefixes': ['Dp']},
    'ec/mb': {'pkg': f'{PKG_ROOT}.base.ec.mb', 'url': '/api/base/ec/mb', 'dom_prefixes': ['Mbh','Mb']},
    'ec/od': {'pkg': f'{PKG_ROOT}.base.ec.od', 'url': '/api/base/ec/od', 'dom_prefixes': ['Odh','Od']},
    'ec/pd': {'pkg': f'{PKG_ROOT}.base.ec.pd', 'url': '/api/base/ec/pd', 'dom_prefixes': ['Pdh','Pd']},
    'ec/pm': {'pkg': f'{PKG_ROOT}.base.ec.pm', 'url': '/api/base/ec/pm', 'dom_prefixes': ['Pmh','Pm']},
    'ec/st': {'pkg': f'{PKG_ROOT}.base.ec.st', 'url': '/api/base/ec/st', 'dom_prefixes': ['Sth','St']},
    'sy':    {'pkg': f'{PKG_ROOT}.base.sy',     'url': '/api/base/sy',    'dom_prefixes': ['Syh','Sy']},
}

def java_base_dir(domain_key):
    parts = domain_key.split('/')
    if len(parts) == 2:
        return f"{JAVA_BASE}/base/{parts[0]}/{parts[1]}"
    return f"{JAVA_BASE}/base/{parts[0]}"

def parse_entity(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    table_m = re.search(r'@Table\s*\([^)]*name\s*=\s*"([^"]+)"', content)
    class_m = re.search(r'public class (\w+)', content)
    table_name = table_m.group(1) if table_m else ''
    class_name = class_m.group(1) if class_m else ''
    pk = None
    lines = content.split('\n')
    for i, ln in enumerate(lines):
        if re.search(r'^\s*@Id\b', ln):
            for j in range(i+1, min(i+6, len(lines))):
                m = re.match(r'\s+private\s+(\w+)\s+(\w+)\s*;', lines[j])
                if m:
                    pk = (m.group(1), m.group(2))
                    break
            break
    fields = []
    for ln in lines:
        m = re.match(r'\s+private\s+(\w+)\s+(\w+)\s*;', ln)
        if m and m.group(2) not in ('serialVersionUID',):
            fields.append((m.group(1), m.group(2)))
    return {'table': table_name, 'class': class_name, 'pk': pk, 'fields': fields}

def id_prefix(table_name):
    tn = table_name.split('.')[-1]
    parts = [p for p in tn.split('_') if p]
    if not parts: return 'XX'
    sb = []
    for i, p in enumerate(parts[1:], 1):
        if i == 1: sb.append(p[:2])
        else: sb.append(p[0])
    return ''.join(sb).upper() if sb else 'XX'

def to_kebab(name, dom_prefixes):
    stripped = name
    for pfx in dom_prefixes:
        if name.startswith(pfx):
            stripped = name[len(pfx):]
            break
    return re.sub(r'(?<=[a-z0-9])(?=[A-Z])', '-', stripped).lower()

def is_hist_log(cls):
    return cls.endswith('Hist') or cls.endswith('Log') or bool(re.match(r'^[A-Z][a-z]+h[A-Z]', cls))

def field_imports(fields):
    imps = []
    if any(t == 'LocalDateTime' for t, _ in fields):
        imps.append('import java.time.LocalDateTime;')
    if any(t == 'BigDecimal' for t, _ in fields):
        imps.append('import java.math.BigDecimal;')
    return ('\n' + '\n'.join(imps)) if imps else ''

def write_if_missing(path, content):
    if os.path.exists(path):
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    return True

def gen_dto(pkg, cls, fields, table):
    imps = field_imports(fields)
    field_lines = '\n'.join(f'    private {t} {n};' for t, n in fields)
    return (f"package {pkg}.data.dto;\n\n"
            f"import lombok.Getter;\nimport lombok.Setter;\nimport lombok.NoArgsConstructor;{imps}\n\n"
            f"@Getter @Setter @NoArgsConstructor\npublic class {cls}Dto {{\n\n"
            f"    // ── {table} ──────────────────────────────────────────\n"
            f"{field_lines}\n\n"
            f"    // ── JOIN: 필요 시 추가 ────────────────────────────────────────\n}}\n")

def gen_req(pkg, cls, fields, entity_pkg):
    imps = field_imports(fields)
    field_lines = '\n'.join(f'    private {t} {n};' for t, n in fields)
    builder_lines = '\n'.join(f'                .{n}({n})' for _, n in fields)
    return (f"package {pkg}.data.vo;\n\n"
            f"import com.fasterxml.jackson.annotation.JsonProperty;\n"
            f"import {entity_pkg}.data.entity.{cls};\n"
            f"import lombok.Getter;\nimport lombok.NoArgsConstructor;\nimport lombok.Setter;{imps}\n\n"
            f"@Getter @Setter @NoArgsConstructor\npublic class {cls}Req {{\n\n"
            f"    @JsonProperty(\"_row_status\")\n"
            f"    private String rowStatus;   // I: insert, U: update, D: delete\n\n"
            f"{field_lines}\n\n"
            f"    public {cls} toEntity() {{\n"
            f"        return {cls}.builder()\n{builder_lines}\n                .build();\n    }}\n}}\n")

def gen_mapper(pkg, cls, entity_pkg, pk):
    pk_type, pk_name = pk if pk else ('String', 'id')
    return (f"package {pkg}.mapper;\n\n"
            f"import {pkg}.data.dto.{cls}Dto;\n"
            f"import {entity_pkg}.data.entity.{cls};\n"
            f"import org.apache.ibatis.annotations.Mapper;\n"
            f"import org.apache.ibatis.annotations.Param;\n\n"
            f"import java.util.List;\nimport java.util.Map;\n\n"
            f"@Mapper\npublic interface {cls}Mapper {{\n\n"
            f"    {cls}Dto selectById(@Param(\"id\") {pk_type} id);\n\n"
            f"    List<{cls}Dto> selectList(@Param(\"p\") Map<String, Object> p);\n\n"
            f"    List<{cls}Dto> selectPageList(@Param(\"p\") Map<String, Object> p);\n\n"
            f"    long selectPageCount(@Param(\"p\") Map<String, Object> p);\n\n"
            f"    int updateSelective({cls} entity);\n}}\n")

def gen_repository(pkg, cls, entity_pkg, pk):
    pk_type = pk[0] if pk else 'String'
    return (f"package {pkg}.repository;\n\n"
            f"import {entity_pkg}.data.entity.{cls};\n"
            f"import org.springframework.data.jpa.repository.JpaRepository;\n\n"
            f"public interface {cls}Repository extends JpaRepository<{cls}, {pk_type}> {{\n}}\n")

def gen_service(pkg, cls, entity_pkg, pk, table, is_ro):
    pk_type, pk_name = pk if pk else ('String', 'id')
    cap = pk_name[0].upper() + pk_name[1:]
    prefix = id_prefix(table)

    crud = '' if is_ro else (
        f"\n    // ── JPA 저장/삭제 ────────────────────────────────────────────\n\n"
        f"    @Transactional\n    public {cls} create({cls} entity) {{\n"
        f"        entity.set{cap}(generateId());\n"
        f"        entity.setRegBy(SecurityUtil.currentUserId());\n"
        f"        entity.setRegDate(LocalDateTime.now());\n"
        f"        {cls} result = repository.save(entity);\n        return result;\n    }}\n\n"
        f"    @Transactional\n    public {cls} save({cls} entity) {{\n"
        f"        if (!repository.existsById(entity.get{cap}()))\n"
        f"            throw new BusinessException(\"존재하지 않는 {cls}입니다: \" + entity.get{cap}());\n"
        f"        entity.setUpdBy(SecurityUtil.currentUserId());\n"
        f"        entity.setUpdDate(LocalDateTime.now());\n"
        f"        {cls} result = repository.save(entity);\n        return result;\n    }}\n\n"
        f"    @Transactional\n    public void delete({pk_type} id) {{\n"
        f"        if (!repository.existsById(id))\n"
        f"            throw new BusinessException(\"존재하지 않는 {cls}입니다: \" + id);\n"
        f"        repository.deleteById(id);\n    }}\n\n"
        f"    /** ID 생성: prefix={prefix} ({table}) */\n"
        f"    private String generateId() {{\n"
        f"        String ts   = LocalDateTime.now().format(ID_FMT);\n"
        f"        String rand = String.format(\"%04d\", (int)(Math.random() * 10000));\n"
        f"        return \"{prefix}\" + ts + rand;\n    }}"
    )
    imps_crud = ('' if is_ro else
        "\nimport com.shopjoy.ecadminapi.common.exception.BusinessException;"
        "\nimport com.shopjoy.ecadminapi.common.util.SecurityUtil;"
        "\nimport java.time.LocalDateTime;\nimport java.time.format.DateTimeFormatter;")
    id_fmt = ('' if is_ro else
        "\n    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern(\"yyMMddHHmmss\");\n")

    return (f"package {pkg}.service;\n\n"
            f"import {pkg}.data.dto.{cls}Dto;\n"
            f"import {entity_pkg}.data.entity.{cls};\n"
            f"import {pkg}.mapper.{cls}Mapper;\n"
            f"import {pkg}.repository.{cls}Repository;\n"
            f"import com.shopjoy.ecadminapi.common.response.PageResult;{imps_crud}\n"
            f"import lombok.RequiredArgsConstructor;\n"
            f"import org.springframework.stereotype.Service;\n"
            f"import org.springframework.transaction.annotation.Transactional;\n\n"
            f"import java.util.HashMap;\nimport java.util.List;\nimport java.util.Map;\n\n"
            f"@Service\n@RequiredArgsConstructor\npublic class {cls}Service {{\n{id_fmt}\n"
            f"    private final {cls}Mapper mapper;\n"
            f"    private final {cls}Repository repository;\n\n"
            f"    // ── MyBatis 조회 ────────────────────────────────────────────\n\n"
            f"    @Transactional(readOnly = true)\n"
            f"    public {cls}Dto getById({pk_type} id) {{\n"
            f"        {cls}Dto result = mapper.selectById(id);\n        return result;\n    }}\n\n"
            f"    @Transactional(readOnly = true)\n"
            f"    public List<{cls}Dto> getList(Map<String, Object> p) {{\n"
            f"        List<{cls}Dto> result = mapper.selectList(p);\n        return result;\n    }}\n\n"
            f"    @Transactional(readOnly = true)\n"
            f"    public PageResult<{cls}Dto> getPageList(Map<String, Object> p, int pageNo, int pageSize) {{\n"
            f"        p = new HashMap<>(p);\n"
            f"        int offset = (pageNo - 1) * pageSize;\n"
            f"        p.put(\"limit\", pageSize);\n        p.put(\"offset\", offset);\n"
            f"        long totalCount = mapper.selectPageCount(p);\n"
            f"        List<{cls}Dto> pageList = mapper.selectPageList(p);\n"
            f"        PageResult<{cls}Dto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);\n"
            f"        return result;\n    }}\n\n"
            f"    @Transactional\n    public int update({cls} entity) {{\n"
            f"        int result = mapper.updateSelective(entity);\n        return result;\n    }}\n"
            f"{crud}\n}}\n")

def gen_controller(pkg, cls, entity_pkg, pk, url_base, url_path, is_ro):
    pk_type, pk_name = pk if pk else ('String', 'id')
    cap = pk_name[0].upper() + pk_name[1:]
    full_url = f'{url_base}/{url_path}'

    crud_ep = '' if is_ro else (
        f"\n    /* ── 등록 (JPA) ── */\n"
        f"    @PostMapping\n"
        f"    public ResponseEntity<ApiResponse<{cls}>> create(@RequestBody {cls} entity) {{\n"
        f"        {cls} result = service.create(entity);\n"
        f"        return ResponseEntity.status(201).body(ApiResponse.created(result));\n    }}\n\n"
        f"    /* ── 전체 수정 (JPA) ── */\n"
        f"    @PutMapping(\"/{{id}}\")\n"
        f"    public ResponseEntity<ApiResponse<{cls}>> save(\n"
        f"            @PathVariable {pk_type} id, @RequestBody {cls} entity) {{\n"
        f"        entity.set{cap}(id);\n"
        f"        {cls} result = service.save(entity);\n"
        f"        return ResponseEntity.ok(ApiResponse.ok(result));\n    }}\n\n"
        f"    /* ── 선택 필드 수정 (MyBatis) ── */\n"
        f"    @PatchMapping(\"/{{id}}\")\n"
        f"    public ResponseEntity<ApiResponse<Integer>> update(\n"
        f"            @PathVariable {pk_type} id, @RequestBody {cls} entity) {{\n"
        f"        entity.set{cap}(id);\n"
        f"        int result = service.update(entity);\n"
        f"        return ResponseEntity.ok(ApiResponse.ok(result));\n    }}\n\n"
        f"    /* ── 삭제 (JPA) ── */\n"
        f"    @DeleteMapping(\"/{{id}}\")\n"
        f"    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable {pk_type} id) {{\n"
        f"        service.delete(id);\n"
        f"        return ResponseEntity.ok(ApiResponse.ok(null, \"삭제되었습니다.\"));\n    }}\n"
    )

    return (f"package {pkg}.controller;\n\n"
            f"import {pkg}.data.dto.{cls}Dto;\n"
            f"import {entity_pkg}.data.entity.{cls};\n"
            f"import {pkg}.service.{cls}Service;\n"
            f"import com.shopjoy.ecadminapi.common.response.ApiResponse;\n"
            f"import com.shopjoy.ecadminapi.common.response.PageResult;\n"
            f"import lombok.RequiredArgsConstructor;\n"
            f"import org.springframework.http.ResponseEntity;\n"
            f"import org.springframework.web.bind.annotation.*;\n\n"
            f"import java.util.HashMap;\nimport java.util.List;\nimport java.util.Map;\n\n"
            f"@RestController\n@RequestMapping(\"{full_url}\")\n@RequiredArgsConstructor\n"
            f"public class {cls}Controller {{\n\n"
            f"    private final {cls}Service service;\n\n"
            f"    @GetMapping\n"
            f"    public ResponseEntity<ApiResponse<List<{cls}Dto>>> list(\n"
            f"            @RequestParam(required = false) String siteId,\n"
            f"            @RequestParam(required = false) String kw,\n"
            f"            @RequestParam(required = false) String dateStart,\n"
            f"            @RequestParam(required = false) String dateEnd,\n"
            f"            @RequestParam(required = false) String sort) {{\n"
            f"        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);\n"
            f"        List<{cls}Dto> result = service.getList(p);\n"
            f"        return ResponseEntity.ok(ApiResponse.ok(result));\n    }}\n\n"
            f"    @GetMapping(\"/page\")\n"
            f"    public ResponseEntity<ApiResponse<PageResult<{cls}Dto>>> page(\n"
            f"            @RequestParam(required = false) String siteId,\n"
            f"            @RequestParam(required = false) String kw,\n"
            f"            @RequestParam(required = false) String dateStart,\n"
            f"            @RequestParam(required = false) String dateEnd,\n"
            f"            @RequestParam(required = false) String sort,\n"
            f"            @RequestParam(defaultValue = \"1\")  int pageNo,\n"
            f"            @RequestParam(defaultValue = \"20\") int pageSize) {{\n"
            f"        Map<String, Object> p = buildParam(siteId, kw, dateStart, dateEnd, sort);\n"
            f"        PageResult<{cls}Dto> result = service.getPageList(p, pageNo, pageSize);\n"
            f"        return ResponseEntity.ok(ApiResponse.ok(result));\n    }}\n\n"
            f"    @GetMapping(\"/{{id}}\")\n"
            f"    public ResponseEntity<ApiResponse<{cls}Dto>> getById(@PathVariable {pk_type} id) {{\n"
            f"        {cls}Dto result = service.getById(id);\n"
            f"        if (result == null) return ResponseEntity.notFound().build();\n"
            f"        return ResponseEntity.ok(ApiResponse.ok(result));\n    }}\n"
            f"{crud_ep}\n"
            f"    private Map<String, Object> buildParam(String siteId, String kw,\n"
            f"                                           String dateStart, String dateEnd, String sort) {{\n"
            f"        Map<String, Object> p = new HashMap<>();\n"
            f"        if (siteId    != null) p.put(\"siteId\",    siteId);\n"
            f"        if (kw        != null) p.put(\"kw\",        kw);\n"
            f"        if (dateStart != null) p.put(\"dateStart\", dateStart);\n"
            f"        if (dateEnd   != null) p.put(\"dateEnd\",   dateEnd);\n"
            f"        if (sort      != null) p.put(\"sort\",      sort);\n"
            f"        return p;\n    }}\n}}\n")

created = 0
skipped = 0

for dom_key, dom_cfg in DOMAINS.items():
    pkg = dom_cfg['pkg']
    url_base = dom_cfg['url']
    dom_prefixes = dom_cfg['dom_prefixes']
    xml_dir = f"{MAPPER_BASE}/{dom_key}"
    if not os.path.isdir(xml_dir):
        continue
    jbase = java_base_dir(dom_key)
    entity_pkg = pkg

    xml_files = sorted(f for f in os.listdir(xml_dir) if f.endswith('Mapper.xml'))
    for xml_file in xml_files:
        cls = xml_file.replace('Mapper.xml', '')
        entity_path = f"{jbase}/data/entity/{cls}.java"
        if not os.path.exists(entity_path):
            print(f"  [SKIP-no-entity] {dom_key}/{cls}")
            continue

        info = parse_entity(entity_path)
        pk = info['pk']
        fields = info['fields']
        table = info['table']
        is_ro = is_hist_log(cls)
        url_path = to_kebab(cls, dom_prefixes)

        if write_if_missing(f"{jbase}/data/dto/{cls}Dto.java", gen_dto(pkg, cls, fields, table)): created += 1
        else: skipped += 1

        if not is_ro:
            if write_if_missing(f"{jbase}/data/vo/{cls}Req.java", gen_req(pkg, cls, fields, entity_pkg)): created += 1
            else: skipped += 1

        if write_if_missing(f"{jbase}/mapper/{cls}Mapper.java", gen_mapper(pkg, cls, entity_pkg, pk)): created += 1
        else: skipped += 1

        if write_if_missing(f"{jbase}/repository/{cls}Repository.java", gen_repository(pkg, cls, entity_pkg, pk)): created += 1
        else: skipped += 1

        if write_if_missing(f"{jbase}/service/{cls}Service.java", gen_service(pkg, cls, entity_pkg, pk, table, is_ro)): created += 1
        else: skipped += 1

        if write_if_missing(f"{jbase}/controller/{cls}Controller.java", gen_controller(pkg, cls, entity_pkg, pk, url_base, url_path, is_ro)): created += 1
        else: skipped += 1

        # Fix XML namespace
        xml_path = f"{xml_dir}/{xml_file}"
        with open(xml_path, 'r', encoding='utf-8') as f2:
            xml_content = f2.read()
        new_xml = re.sub(r'namespace="[^"]*"', f'namespace="{pkg}.mapper.{cls}Mapper"', xml_content)
        if new_xml != xml_content:
            with open(xml_path, 'w', encoding='utf-8') as f2:
                f2.write(new_xml)

print(f"\n생성: {created}개, 스킵(기존): {skipped}개")
