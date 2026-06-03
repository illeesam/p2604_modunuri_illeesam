package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdChgHistRepository;
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
public class PdhProdChgHistService {

    private final PdhProdChgHistRepository pdhProdChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 변경 이력 키조회 */
    public PdhProdChgHistDto.Item getById(String id) {
        PdhProdChgHistDto.Item dto = pdhProdChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdChgHistDto.Item getByIdOrNull(String id) {
        return pdhProdChgHistRepository.selectById(id).orElse(null);
    }

    /* 상품 변경 이력 상세조회 */
    public PdhProdChgHist findById(String id) {
        return pdhProdChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdChgHist findByIdOrNull(String id) {
        return pdhProdChgHistRepository.findById(id).orElse(null);
    }

    /* 상품 변경 이력 키검증 */
    public boolean existsById(String id) {
        return pdhProdChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdhProdChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 변경 이력 목록조회 */
    public List<PdhProdChgHistDto.Item> getList(PdhProdChgHistDto.Request req) {
        return pdhProdChgHistRepository.selectList(req);
    }

    /* 상품 변경 이력 페이지조회 */
    public PdhProdChgHistDto.PageResponse getPageData(PdhProdChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdChgHistRepository.selectPageData(req);
    }

    /* 상품 변경 이력 등록 */
    @Transactional
    public PdhProdChgHist create(PdhProdChgHist body) {
        body.setProdChgHistId(CmUtil.generateId("pdh_prod_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 변경 이력 수정 */
    @Transactional
    public PdhProdChgHist update(String id, PdhProdChgHist body) {
        CmUtil.requireId(id, "id", this);
        PdhProdChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 변경 이력 수정 */
    @Transactional
    public PdhProdChgHist updateSelective(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) throw new CmBizException("prodChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdhProdChgHist entity = findById(id);
        pdhProdChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdhProdChgHist saveOneBase(PdhProdChgHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getProdChgHistId() == null || entity.getProdChgHistId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getProdChgHistId() == null)
                throw new CmBizException("삭제 대상 prodChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdhProdChgHistRepository.existsById(entity.getProdChgHistId()))
                throw new CmBizException("존재하지 않는 PdhProdChgHist입니다: " + entity.getProdChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            pdhProdChgHistRepository.deleteById(entity.getProdChgHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setProdChgHistId(CmUtil.generateId("pdh_prod_chg_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdhProdChgHist saved = pdhProdChgHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getProdChgHistId() == null)
                throw new CmBizException("수정 대상 prodChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdhProdChgHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdhProdChgHist입니다: " + entity.getProdChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getProdChgHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdhProdChgHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdhProdChgHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getProdChgHistId() == null || row.getProdChgHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdhProdChgHist::getProdChgHistId, "U", "prodChgHistId", this);
        CmUtil.requireRowIds(rows, PdhProdChgHist::getProdChgHistId, "D", "prodChgHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdhProdChgHist::getProdChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdChgHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdhProdChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdhProdChgHist row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdhProdChgHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getProdChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdhProdChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdChgHist row : insertRows) {
            row.setProdChgHistId(CmUtil.generateId("pdh_prod_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdChgHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
