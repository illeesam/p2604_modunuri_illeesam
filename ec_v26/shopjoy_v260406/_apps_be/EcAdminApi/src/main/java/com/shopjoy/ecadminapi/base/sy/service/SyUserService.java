package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyUserService {

    private final SyUserRepository syUserRepository;

    @PersistenceContext
    private EntityManager em;

    // ── 조회 (MyBatis - JOIN 필드 포함) ──────────────────────────

    /** getById — 단건조회 (QueryDSL, JOIN 필드 포함된 Item) */
    public SyUserDto.Item getById(String id) {
        SyUserDto.Item dto = syUserRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyUserDto.Item getByIdOrNull(String id) {
        return syUserRepository.selectById(id).orElse(null);
    }

    /** findById — 단건조회 (JPA, 영속성 컨텍스트 동기화된 SyUser 엔티티). 변경 메서드의 저장 후 응답에 사용. */
    public SyUser findById(String id) {
        return syUserRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyUser findByIdOrNull(String id) {
        return syUserRepository.findById(id).orElse(null);
    }

    /** existsById — 존재 여부 확인 (JPA) */
    public boolean existsById(String id) {
        return syUserRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syUserRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 목록조회 (QueryDSL Request 받아 Map 변환 후 Repository 호출 — DTO 타입 안전 + Repository missing field 안전) */
    public List<SyUserDto.Item> getList(SyUserDto.Request req) {
        return syUserRepository.selectList(req);
    }

    /** getPageData — 페이징조회 (QueryDSL Request → Repository 호출) */
    public SyUserDto.PageResponse getPageData(SyUserDto.Request req) {
        PageHelper.addPaging(req);
        return syUserRepository.selectPageData(req);
    }

    /** countList — 검색조건 기준 전체 카운트 (대량 export 시 안전 상한 검증용) */
    public long countList(SyUserDto.Request req) {
        return syUserRepository.selectCount(req);
    }

    /**
     * fetchChunked — 검색조건 기준 전체 결과를 chunk 단위로 fetch 하여 consumer 에 흘려보낸다.
     * <p>QueryDSL + JPA 환경에서 메모리 안전한 대용량 export 용도.
     * <ul>
     *   <li>chunk 크기만큼만 JVM heap 점유 → 마이크로 백엔드(작은 메모리)에서도 안전</li>
     *   <li>각 chunk 처리 후 em.clear() 로 영속성 컨텍스트 정리</li>
     *   <li>호출 측은 row 단위 consumer 로 받아 SXSSF sheet 등에 즉시 write</li>
     * </ul>
     * <p><b>안전장치</b>:
     * <ul>
     *   <li>req 원본을 변형하지 않음 — snapshot 복사본에 pageNo/pageSize 만 세팅</li>
     *   <li>sort 미지정 시 PK(userId) 기본 정렬 강제 — chunk 사이 중복/누락 방지</li>
     * </ul>
     *
     * @param req       검색조건 (원본은 변경되지 않음. pageNo/pageSize 는 무시됨)
     * @param chunkSize 한 번에 조회할 행수 (권장 1,000~5,000)
     * @param consumer  각 행을 받는 콜백
     * @return 총 처리 행수
     */
    public int fetchChunked(SyUserDto.Request req, int chunkSize, java.util.function.Consumer<SyUserDto.Item> consumer) {
        // req snapshot — 원본 보존
        SyUserDto.Request snap = new SyUserDto.Request();
        VoUtil.voCopy(req, snap);
        snap.setPageSize(chunkSize);
        // 정렬이 없으면 PK 강제 — PostgreSQL 임의순서로 인한 chunk 간 중복/누락 방지
        if (snap.getSort() == null || snap.getSort().isBlank()) {
            snap.setSort("userId asc");
        }

        int pageNo = 1;
        int totalProcessed = 0;
        while (true) {
            snap.setPageNo(pageNo);
            List<SyUserDto.Item> chunk = syUserRepository.selectList(snap);
            if (chunk.isEmpty()) break;
            for (SyUserDto.Item item : chunk) consumer.accept(item);
            totalProcessed += chunk.size();
            if (chunk.size() < chunkSize) break;
            pageNo++;
            em.clear();
        }
        return totalProcessed;
    }

    // ── 변경 (JPA - SyUser 엔티티 반환) ──────────────────────────

    /** create — 생성 */
    @Transactional
    public SyUser create(SyUser body) {
        body.setUserId(CmUtil.generateId("sy_user"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyUser saved = syUserRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** update — 선택 필드 수정 (JPA + VoUtil voCopyExclude) */
    @Transactional
    public SyUser update(String id, SyUser body) {
        CmUtil.requireId(id, "id", this);
        SyUser entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "userId^loginId^loginPwdHash^regBy^regDate^lastLogin^lastLoginDate^loginFailCnt");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyUser saved = syUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 선택 필드 수정 (QueryDSL selective UPDATE).
     *  updDate 는 Repository 가 DB CURRENT_TIMESTAMP 로 자동 채움. */
    @Transactional
    public SyUser updateSelective(SyUser entity) {
        if (entity.getUserId() == null)
            throw new CmBizException("userId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!syUserRepository.existsById(entity.getUserId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUserId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        int affected = syUserRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        // QueryDSL 벌크연산 후 영속성 컨텍스트 동기화
        em.clear();
        return entity;
    }

    /** delete — 삭제 (JPA) */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyUser entity = findById(id);
        syUserRepository.delete(entity);
        em.flush();
        if (syUserRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save — rowStatus(I/U/D/M) 단건 분기 처리. saveList 의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기.
     *  M(merge/upsert): userId 있으면 U, 없으면 I 로 정규화. null/blank 도 동일.
     *
     *  @param cmd    API 마지막 path 세그먼트. "base"=기본(/save), "pwd"=비밀번호 저장 등 변형
     *  @param entity 저장 대상 */
    @Transactional
    public SyUser saveOneBase(SyUser entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank — userId 유무로 I/U 분기 후 그 분기 흐름 재사용 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getUserId() == null || entity.getUserId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getUserId() == null)
                throw new CmBizException("삭제 대상 userId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!syUserRepository.existsById(entity.getUserId()))
                throw new CmBizException("존재하지 않는 SyUser입니다: " + entity.getUserId() + "::" + CmUtil.svcCallerInfo(this));
            syUserRepository.deleteById(entity.getUserId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setUserId(CmUtil.generateId("sy_user"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            SyUser saved = syUserRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            /* U — QueryDSL updateSelective (SELECT 없이 UPDATE 만, 1차 캐시 우회).
             *     updDate 는 Repository 가 DB CURRENT_TIMESTAMP 로 자동 채움. */
            if (entity.getUserId() == null)
                throw new CmBizException("수정 대상 userId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = syUserRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyUser입니다: " + entity.getUserId() + "::" + CmUtil.svcCallerInfo(this));
            /* 벌크 UPDATE 후 직후 findById 가 stale 1차 캐시를 보지 않도록 clear 필수 */
            em.clear();
            return findById(entity.getUserId());
        }
        /* 안전망 — 정규화에서 모두 I/U/D 로 매핑되므로 도달 불가. 알 수 없는 값이 새어 들어오면 즉시 차단. */
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList — 일괄 저장 (DELETE/UPDATE/INSERT 단계별 처리).
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기.
     *  rowStatus 규약: I(insert)/U(update)/D(delete)/M(merge·upsert)/null·blank(=U).
     *
     *  @param cmd  API 마지막 path 세그먼트. "base"=기본(/save-list), "order"=정렬 변경 등 변형
     *  @param rows 저장 대상 목록 */
    @Transactional
    public void saveListBase(List<SyUser> rows) {
        /* 0단계: rowStatus 정규화
         *  - M(merge) / null / blank → userId 유무로 I/U
         *  - I/U/D 외 알 수 없는 값 → 예외 (조용히 무시 금지) */
        for (SyUser row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getUserId() == null || row.getUserId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SyUser::getUserId, "U", "userId", this);
        CmUtil.requireRowIds(rows, SyUser::getUserId, "D", "userId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SyUser::getUserId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syUserRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE 처리 — QueryDSL updateSelective (SELECT 없이 UPDATE 만, 1차 캐시 우회)
        List<SyUser> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyUser row : updateRows) {
            row.setUpdBy(authId);
            int affected = syUserRepository.updateSelective(row);
            if (affected == 0) {
                throw new CmBizException("존재하지 않는 데이터입니다: " + row.getUserId() + "::" + CmUtil.svcCallerInfo(this));
            }
        }

        // 3단계: INSERT 처리 + 처리된 ID 수집
        List<SyUser> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyUser row : insertRows) {
            row.setUserId(CmUtil.generateId("sy_user"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syUserRepository.save(row);
        }

        /* 4단계: 영속성 컨텍스트 동기화 — DELETE/벌크 UPDATE/INSERT 가 섞여 있어 호출자가 같은 트랜잭션 내에서
         *        결과를 다시 조회할 때 stale 1차 캐시를 안 보도록 한 번에 flush+clear. */
        em.flush();
        em.clear();
        return;

    }

    /** getDeptTreeNodeCounts — 부서 트리 노드별 사용자수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 사용자만 카운트 (page 그리드 결과와 동기).
     *   결과: { deptId: cnt, '__total__': 전체, '__orphan__': dept 없음 } */
    public java.util.List<java.util.Map<String, Object>> getDeptTreeNodeCounts(SyUserDto.Request req) {
        return syUserRepository.selectDeptTreeUserCnts(req);
    }
}
