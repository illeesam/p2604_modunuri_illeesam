package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdDlivTmpltRepository;
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
public class PdDlivTmpltService {

    private final PdDlivTmpltRepository pdDlivTmpltRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배송 템플릿 키조회 */
    public PdDlivTmpltDto.Item getById(String id) {
        PdDlivTmpltDto.Item dto = pdDlivTmpltRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdDlivTmpltDto.Item getByIdOrNull(String id) {
        return pdDlivTmpltRepository.selectById(id).orElse(null);
    }

    /* 배송 템플릿 상세조회 */
    public PdDlivTmplt findById(String id) {
        return pdDlivTmpltRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdDlivTmplt findByIdOrNull(String id) {
        return pdDlivTmpltRepository.findById(id).orElse(null);
    }

    /* 배송 템플릿 키검증 */
    public boolean existsById(String id) {
        return pdDlivTmpltRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdDlivTmpltRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 배송 템플릿 목록조회 */
    public List<PdDlivTmpltDto.Item> getList(PdDlivTmpltDto.Request req) {
        return pdDlivTmpltRepository.selectList(req);
    }

    /* 배송 템플릿 페이지조회 */
    public PdDlivTmpltDto.PageResponse getPageData(PdDlivTmpltDto.Request req) {
        PageHelper.addPaging(req);
        return pdDlivTmpltRepository.selectPageData(req);
    }

    /* 배송 템플릿 등록 */
    @Transactional
    public PdDlivTmplt create(PdDlivTmplt body) {
        body.setDlivTmpltId(CmUtil.generateId("pd_dliv_tmplt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdDlivTmplt saved = pdDlivTmpltRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 배송 템플릿 수정 */
    @Transactional
    public PdDlivTmplt update(String id, PdDlivTmplt body) {
        CmUtil.requireId(id, "id", this);
        PdDlivTmplt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivTmpltId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdDlivTmplt saved = pdDlivTmpltRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배송 템플릿 수정 */
    @Transactional
    public PdDlivTmplt updateSelective(PdDlivTmplt entity) {
        if (entity.getDlivTmpltId() == null) throw new CmBizException("dlivTmpltId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDlivTmpltId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivTmpltId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdDlivTmpltRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 배송 템플릿 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdDlivTmplt entity = findById(id);
        pdDlivTmpltRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdDlivTmplt save(String cmd, PdDlivTmplt entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getDlivTmpltId() == null || entity.getDlivTmpltId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getDlivTmpltId() == null)
                    throw new CmBizException("삭제 대상 dlivTmpltId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pdDlivTmpltRepository.existsById(entity.getDlivTmpltId()))
                    throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + entity.getDlivTmpltId() + "::" + CmUtil.svcCallerInfo(this));
                pdDlivTmpltRepository.deleteById(entity.getDlivTmpltId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setDlivTmpltId(CmUtil.generateId("pd_dliv_tmplt"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PdDlivTmplt saved = pdDlivTmpltRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getDlivTmpltId() == null)
                    throw new CmBizException("수정 대상 dlivTmpltId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pdDlivTmpltRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PdDlivTmplt입니다: " + entity.getDlivTmpltId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getDlivTmpltId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PdDlivTmplt> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PdDlivTmplt row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getDlivTmpltId() == null || row.getDlivTmpltId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PdDlivTmplt::getDlivTmpltId, "U", "dlivTmpltId", this);
            CmUtil.requireRowIds(rows, PdDlivTmplt::getDlivTmpltId, "D", "dlivTmpltId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PdDlivTmplt::getDlivTmpltId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pdDlivTmpltRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PdDlivTmplt> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PdDlivTmplt row : updateRows) {
                row.setUpdBy(authId);
                int affected = pdDlivTmpltRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getDlivTmpltId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PdDlivTmplt> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PdDlivTmplt row : insertRows) {
                row.setDlivTmpltId(CmUtil.generateId("pd_dliv_tmplt"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdDlivTmpltRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
