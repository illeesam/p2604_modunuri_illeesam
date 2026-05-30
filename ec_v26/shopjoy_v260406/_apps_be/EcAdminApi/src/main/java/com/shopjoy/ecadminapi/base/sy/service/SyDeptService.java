package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.mapper.SyDeptMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
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
public class SyDeptService {

    private final SyDeptMapper syDeptMapper;
    private final SyDeptRepository syDeptRepository;

    @PersistenceContext
    private EntityManager em;

    /** getTree — 트리조회 (MyBatis 전용 — Repository 미적용) */
    public List<SyDeptDto.Item> getTree() {
        return syDeptMapper.selectTree();
    }

    /** getById — 단건조회 */
    public SyDeptDto.Item getById(String id) {
        SyDeptDto.Item dto = syDeptRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyDeptDto.Item getByIdOrNull(String id) {
        return syDeptRepository.selectById(id).orElse(null);
    }

    /** findById — 단건조회 (JPA) */
    public SyDept findById(String id) {
        return syDeptRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyDept findByIdOrNull(String id) {
        return syDeptRepository.findById(id).orElse(null);
    }

    /** existsById — 존재 여부 확인 */
    public boolean existsById(String id) {
        return syDeptRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syDeptRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 목록조회 */
    public List<SyDeptDto.Item> getList(SyDeptDto.Request req) {
        return syDeptRepository.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SyDeptDto.PageResponse getPageData(SyDeptDto.Request req) {
        PageHelper.addPaging(req);
        return syDeptRepository.selectPageList(req);
    }

    /* 부서 등록 */
    @Transactional
    public SyDept create(SyDept body) {
        body.setDeptId(CmUtil.generateId("sy_dept"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyDept saved = syDeptRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 부서 수정 */
    @Transactional
    public SyDept update(String id, SyDept body) {
        CmUtil.requireId(id, "id", this);
        SyDept entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "deptId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyDept saved = syDeptRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 부서 수정 */
    @Transactional
    public SyDept updateSelective(SyDept entity) {
        if (entity.getDeptId() == null) throw new CmBizException("deptId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDeptId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDeptId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syDeptRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 부서 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyDept entity = findById(id);
        syDeptRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyDept save(String cmd, SyDept entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getDeptId() == null || entity.getDeptId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getDeptId() == null)
                    throw new CmBizException("삭제 대상 deptId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syDeptRepository.existsById(entity.getDeptId()))
                    throw new CmBizException("존재하지 않는 SyDept입니다: " + entity.getDeptId() + "::" + CmUtil.svcCallerInfo(this));
                syDeptRepository.deleteById(entity.getDeptId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setDeptId(CmUtil.generateId("sy_dept"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyDept saved = syDeptRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getDeptId() == null)
                    throw new CmBizException("수정 대상 deptId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syDeptRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyDept입니다: " + entity.getDeptId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getDeptId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyDept> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyDept row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getDeptId() == null || row.getDeptId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyDept::getDeptId, "U", "deptId", this);
            CmUtil.requireRowIds(rows, SyDept::getDeptId, "D", "deptId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyDept::getDeptId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syDeptRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyDept> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyDept row : updateRows) {
                row.setUpdBy(authId);
                int affected = syDeptRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDeptId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyDept> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyDept row : insertRows) {
                row.setDeptId(CmUtil.generateId("sy_dept"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syDeptRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
