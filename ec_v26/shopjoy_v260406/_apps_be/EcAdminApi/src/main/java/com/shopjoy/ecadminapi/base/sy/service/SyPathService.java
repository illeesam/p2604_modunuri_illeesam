package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
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
public class SyPathService {

    private final SyPathRepository syPathRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public SyPathDto.Item getById(String id) {
        SyPathDto.Item dto = syPathRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyPathDto.Item getByIdOrNull(String id) {
        return syPathRepository.selectById(id).orElse(null);
    }

    /* 상세조회 */
    public SyPath findById(String id) {
        return syPathRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyPath findByIdOrNull(String id) {
        return syPathRepository.findById(id).orElse(null);
    }

    /* 키검증 */
    public boolean existsById(String id) {
        return syPathRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syPathRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 목록조회 */
    public List<SyPathDto.Item> getList(SyPathDto.Request req) {
        return syPathRepository.selectList(req);
    }

    /* 페이지조회 */
    public SyPathDto.PageResponse getPageData(SyPathDto.Request req) {
        PageHelper.addPaging(req);
        return syPathRepository.selectPageData(req);
    }

    /* 등록 */
    @Transactional
    public SyPath create(SyPath body) {
        body.setPathId(CmUtil.generateId("sy_path"));
        body.setRegBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        body.setUpdDate(LocalDateTime.now());
        SyPath saved = syPathRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 수정 */
    @Transactional
    public SyPath update(String id, SyPath body) {
        CmUtil.requireId(id, "id", this);
        SyPath entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "pathId^regBy^regDate");
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        SyPath saved = syPathRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyPath updateSelective(SyPath entity) {
        if (entity.getPathId() == null) throw new CmBizException("pathId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPathId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPathId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(CmUtil.nvl(SecurityUtil.getAuthUser().authId(), "system"));
        entity.setUpdDate(LocalDateTime.now());
        int affected = syPathRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyPath entity = findById(id);
        syPathRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyPath save(String cmd, SyPath entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getPathId() == null || entity.getPathId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getPathId() == null)
                    throw new CmBizException("삭제 대상 pathId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syPathRepository.existsById(entity.getPathId()))
                    throw new CmBizException("존재하지 않는 SyPath입니다: " + entity.getPathId() + "::" + CmUtil.svcCallerInfo(this));
                syPathRepository.deleteById(entity.getPathId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setPathId(CmUtil.generateId("sy_path"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyPath saved = syPathRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getPathId() == null)
                    throw new CmBizException("수정 대상 pathId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syPathRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyPath입니다: " + entity.getPathId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getPathId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyPath> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyPath row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getPathId() == null || row.getPathId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyPath::getPathId, "U", "pathId", this);
            CmUtil.requireRowIds(rows, SyPath::getPathId, "D", "pathId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyPath::getPathId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syPathRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyPath> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyPath row : updateRows) {
                row.setUpdBy(authId);
                int affected = syPathRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPathId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyPath> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyPath row : insertRows) {
                row.setPathId(CmUtil.generateId("sy_path"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syPathRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
