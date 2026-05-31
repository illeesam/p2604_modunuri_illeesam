package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyCodeService {

    private final SyCodeRepository syCodeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public SyCodeDto.Item getById(String id) {
        SyCodeDto.Item dto = syCodeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCodeDto.Item getByIdOrNull(String id) {
        return syCodeRepository.selectById(id).orElse(null);
    }

    /* 상세조회 */
    public SyCode findById(String id) {
        return syCodeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyCode findByIdOrNull(String id) {
        return syCodeRepository.findById(id).orElse(null);
    }

    /* 키검증 */
    public boolean existsById(String id) {
        return syCodeRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syCodeRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 목록조회 */
    public List<SyCodeDto.Item> getList(SyCodeDto.Request req) {
        return syCodeRepository.selectList(req);
    }

    /* 페이지조회 */
    public SyCodeDto.PageResponse getPageData(SyCodeDto.Request req) {
        PageHelper.addPaging(req);
        return syCodeRepository.selectPageData(req);
    }

    /* 등록 */
    @Transactional
    public SyCode create(SyCode body) {
        body.setCodeId(CmUtil.generateId("sy_code"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 수정 */
    @Transactional
    public SyCode update(String id, SyCode body) {
        CmUtil.requireId(id, "id", this);
        SyCode entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "codeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyCode saved = syCodeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyCode updateSelective(SyCode entity) {
        if (entity.getCodeId() == null) throw new CmBizException("codeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCodeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCodeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syCodeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyCode entity = findById(id);
        syCodeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyCode save(String cmd, SyCode entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getCodeId() == null || entity.getCodeId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getCodeId() == null)
                    throw new CmBizException("삭제 대상 codeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syCodeRepository.existsById(entity.getCodeId()))
                    throw new CmBizException("존재하지 않는 SyCode입니다: " + entity.getCodeId() + "::" + CmUtil.svcCallerInfo(this));
                syCodeRepository.deleteById(entity.getCodeId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setCodeId(CmUtil.generateId("sy_code"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyCode saved = syCodeRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getCodeId() == null)
                    throw new CmBizException("수정 대상 codeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syCodeRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyCode입니다: " + entity.getCodeId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getCodeId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyCode> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyCode row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getCodeId() == null || row.getCodeId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyCode::getCodeId, "U", "codeId", this);
            CmUtil.requireRowIds(rows, SyCode::getCodeId, "D", "codeId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyCode::getCodeId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syCodeRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyCode> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyCode row : updateRows) {
                row.setUpdBy(authId);
                int affected = syCodeRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCodeId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyCode> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyCode row : insertRows) {
                row.setCodeId(CmUtil.generateId("sy_code"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syCodeRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        } else if ("order".equals(cmd)) {
            /* order 전용 — 행 드래그앤드롭 정렬 변경 시 sortOrd 만 일괄 UPDATE.
             *   - 입력 row 는 codeId + sortOrd 만 필수 (다른 필드는 무시)
             *   - rowStatus 검증 없음 — 호출자가 변경된 행만 보내야 함
             *   - updateSelective 가 null 필드를 건드리지 않으므로 안전 */
            CmUtil.requireRowIds(rows, SyCode::getCodeId, "U", "codeId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            for (SyCode row : rows) {
                if (row.getSortOrd() == null) continue;   // sortOrd 없으면 skip
                SyCode patch = new SyCode();
                patch.setCodeId(row.getCodeId());
                patch.setSortOrd(row.getSortOrd());
                patch.setUpdBy(authId);
                int affected = syCodeRepository.updateSelective(patch);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCodeId() + "::" + CmUtil.svcCallerInfo(this));
            }
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
