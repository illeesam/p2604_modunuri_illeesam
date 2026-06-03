package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdContentChgHistRepository;
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
public class PdhProdContentChgHistService {

    private final PdhProdContentChgHistRepository pdhProdContentChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 콘텐츠 변경 이력 키조회 */
    public PdhProdContentChgHistDto.Item getById(String id) {
        PdhProdContentChgHistDto.Item dto = pdhProdContentChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdContentChgHistDto.Item getByIdOrNull(String id) {
        return pdhProdContentChgHistRepository.selectById(id).orElse(null);
    }

    /* 상품 콘텐츠 변경 이력 상세조회 */
    public PdhProdContentChgHist findById(String id) {
        return pdhProdContentChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdContentChgHist findByIdOrNull(String id) {
        return pdhProdContentChgHistRepository.findById(id).orElse(null);
    }

    /* 상품 콘텐츠 변경 이력 키검증 */
    public boolean existsById(String id) {
        return pdhProdContentChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdhProdContentChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 콘텐츠 변경 이력 목록조회 */
    public List<PdhProdContentChgHistDto.Item> getList(PdhProdContentChgHistDto.Request req) {
        return pdhProdContentChgHistRepository.selectList(req);
    }

    /* 상품 콘텐츠 변경 이력 페이지조회 */
    public PdhProdContentChgHistDto.PageResponse getPageData(PdhProdContentChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdContentChgHistRepository.selectPageData(req);
    }

    /* 상품 콘텐츠 변경 이력 등록 */
    @Transactional
    public PdhProdContentChgHist create(PdhProdContentChgHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_content_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdContentChgHist saved = pdhProdContentChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 콘텐츠 변경 이력 수정 */
    @Transactional
    public PdhProdContentChgHist update(String id, PdhProdContentChgHist body) {
        CmUtil.requireId(id, "id", this);
        PdhProdContentChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "histId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdContentChgHist saved = pdhProdContentChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 콘텐츠 변경 이력 수정 */
    @Transactional
    public PdhProdContentChgHist updateSelective(PdhProdContentChgHist entity) {
        if (entity.getHistId() == null) throw new CmBizException("histId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdContentChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 콘텐츠 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdhProdContentChgHist entity = findById(id);
        pdhProdContentChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdhProdContentChgHist saveOneBase(PdhProdContentChgHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getHistId() == null || entity.getHistId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getHistId() == null)
                throw new CmBizException("삭제 대상 histId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pdhProdContentChgHistRepository.existsById(entity.getHistId()))
                throw new CmBizException("존재하지 않는 PdhProdContentChgHist입니다: " + entity.getHistId() + "::" + CmUtil.svcCallerInfo(this));
            pdhProdContentChgHistRepository.deleteById(entity.getHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setHistId(CmUtil.generateId("pdh_prod_content_chg_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PdhProdContentChgHist saved = pdhProdContentChgHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getHistId() == null)
                throw new CmBizException("수정 대상 histId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pdhProdContentChgHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PdhProdContentChgHist입니다: " + entity.getHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PdhProdContentChgHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PdhProdContentChgHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getHistId() == null || row.getHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PdhProdContentChgHist::getHistId, "U", "histId", this);
        CmUtil.requireRowIds(rows, PdhProdContentChgHist::getHistId, "D", "histId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PdhProdContentChgHist::getHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdContentChgHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PdhProdContentChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PdhProdContentChgHist row : updateRows) {
            row.setUpdBy(authId);
            int affected = pdhProdContentChgHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PdhProdContentChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdContentChgHist row : insertRows) {
            row.setHistId(CmUtil.generateId("pdh_prod_content_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdContentChgHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
