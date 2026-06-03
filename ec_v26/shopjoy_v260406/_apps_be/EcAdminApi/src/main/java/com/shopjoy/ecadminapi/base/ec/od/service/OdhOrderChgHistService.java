package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderChgHistRepository;
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
public class OdhOrderChgHistService {

    private final OdhOrderChgHistRepository odhOrderChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 주문 변경 이력 키조회 */
    public OdhOrderChgHistDto.Item getById(String id) {
        OdhOrderChgHistDto.Item dto = odhOrderChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderChgHistDto.Item getByIdOrNull(String id) {
        return odhOrderChgHistRepository.selectById(id).orElse(null);
    }

    /* 주문 변경 이력 상세조회 */
    public OdhOrderChgHist findById(String id) {
        return odhOrderChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderChgHist findByIdOrNull(String id) {
        return odhOrderChgHistRepository.findById(id).orElse(null);
    }

    /* 주문 변경 이력 키검증 */
    public boolean existsById(String id) {
        return odhOrderChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhOrderChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 주문 변경 이력 목록조회 */
    public List<OdhOrderChgHistDto.Item> getList(OdhOrderChgHistDto.Request req) {
        return odhOrderChgHistRepository.selectList(req);
    }

    /* 주문 변경 이력 페이지조회 */
    public OdhOrderChgHistDto.PageResponse getPageData(OdhOrderChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhOrderChgHistRepository.selectPageData(req);
    }

    /* 주문 변경 이력 등록 */
    @Transactional
    public OdhOrderChgHist create(OdhOrderChgHist body) {
        body.setOrderChgHistId(CmUtil.generateId("odh_order_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhOrderChgHist saved = odhOrderChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 주문 변경 이력 수정 */
    @Transactional
    public OdhOrderChgHist update(String id, OdhOrderChgHist body) {
        CmUtil.requireId(id, "id", this);
        OdhOrderChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderChgHist saved = odhOrderChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 변경 이력 수정 */
    @Transactional
    public OdhOrderChgHist updateSelective(OdhOrderChgHist entity) {
        if (entity.getOrderChgHistId() == null) throw new CmBizException("orderChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhOrderChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 주문 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhOrderChgHist entity = findById(id);
        odhOrderChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhOrderChgHist saveOneBase(OdhOrderChgHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getOrderChgHistId() == null || entity.getOrderChgHistId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getOrderChgHistId() == null)
                throw new CmBizException("삭제 대상 orderChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!odhOrderChgHistRepository.existsById(entity.getOrderChgHistId()))
                throw new CmBizException("존재하지 않는 OdhOrderChgHist입니다: " + entity.getOrderChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            odhOrderChgHistRepository.deleteById(entity.getOrderChgHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setOrderChgHistId(CmUtil.generateId("odh_order_chg_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            OdhOrderChgHist saved = odhOrderChgHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getOrderChgHistId() == null)
                throw new CmBizException("수정 대상 orderChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = odhOrderChgHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdhOrderChgHist입니다: " + entity.getOrderChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getOrderChgHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdhOrderChgHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdhOrderChgHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getOrderChgHistId() == null || row.getOrderChgHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdhOrderChgHist::getOrderChgHistId, "U", "orderChgHistId", this);
        CmUtil.requireRowIds(rows, OdhOrderChgHist::getOrderChgHistId, "D", "orderChgHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdhOrderChgHist::getOrderChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhOrderChgHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdhOrderChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderChgHist row : updateRows) {
            row.setUpdBy(authId);
            int affected = odhOrderChgHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getOrderChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdhOrderChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderChgHist row : insertRows) {
            row.setOrderChgHistId(CmUtil.generateId("odh_order_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhOrderChgHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
