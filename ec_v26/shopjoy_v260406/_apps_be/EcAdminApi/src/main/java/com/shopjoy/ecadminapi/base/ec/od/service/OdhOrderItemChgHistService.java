package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderItemChgHistRepository;
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
public class OdhOrderItemChgHistService {

    private final OdhOrderItemChgHistRepository odhOrderItemChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 주문 아이템 변경 이력 키조회 */
    public OdhOrderItemChgHistDto.Item getById(String id) {
        OdhOrderItemChgHistDto.Item dto = odhOrderItemChgHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderItemChgHistDto.Item getByIdOrNull(String id) {
        return odhOrderItemChgHistRepository.selectById(id).orElse(null);
    }

    /* 주문 아이템 변경 이력 상세조회 */
    public OdhOrderItemChgHist findById(String id) {
        return odhOrderItemChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderItemChgHist findByIdOrNull(String id) {
        return odhOrderItemChgHistRepository.findById(id).orElse(null);
    }

    /* 주문 아이템 변경 이력 키검증 */
    public boolean existsById(String id) {
        return odhOrderItemChgHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhOrderItemChgHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 주문 아이템 변경 이력 목록조회 */
    public List<OdhOrderItemChgHistDto.Item> getList(OdhOrderItemChgHistDto.Request req) {
        return odhOrderItemChgHistRepository.selectList(req);
    }

    /* 주문 아이템 변경 이력 페이지조회 */
    public OdhOrderItemChgHistDto.PageResponse getPageData(OdhOrderItemChgHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhOrderItemChgHistRepository.selectPageData(req);
    }

    /* 주문 아이템 변경 이력 등록 */
    @Transactional
    public OdhOrderItemChgHist create(OdhOrderItemChgHist body) {
        body.setOrderItemChgHistId(CmUtil.generateId("odh_order_item_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhOrderItemChgHist saved = odhOrderItemChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 주문 아이템 변경 이력 수정 */
    @Transactional
    public OdhOrderItemChgHist update(String id, OdhOrderItemChgHist body) {
        CmUtil.requireId(id, "id", this);
        OdhOrderItemChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderItemChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderItemChgHist saved = odhOrderItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 아이템 변경 이력 수정 */
    @Transactional
    public OdhOrderItemChgHist updateSelective(OdhOrderItemChgHist entity) {
        if (entity.getOrderItemChgHistId() == null) throw new CmBizException("orderItemChgHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderItemChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhOrderItemChgHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 주문 아이템 변경 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhOrderItemChgHist entity = findById(id);
        odhOrderItemChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhOrderItemChgHist saveOneBase(OdhOrderItemChgHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getOrderItemChgHistId() == null || entity.getOrderItemChgHistId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getOrderItemChgHistId() == null)
                throw new CmBizException("삭제 대상 orderItemChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!odhOrderItemChgHistRepository.existsById(entity.getOrderItemChgHistId()))
                throw new CmBizException("존재하지 않는 OdhOrderItemChgHist입니다: " + entity.getOrderItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            odhOrderItemChgHistRepository.deleteById(entity.getOrderItemChgHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setOrderItemChgHistId(CmUtil.generateId("odh_order_item_chg_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            OdhOrderItemChgHist saved = odhOrderItemChgHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getOrderItemChgHistId() == null)
                throw new CmBizException("수정 대상 orderItemChgHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = odhOrderItemChgHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdhOrderItemChgHist입니다: " + entity.getOrderItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getOrderItemChgHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdhOrderItemChgHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdhOrderItemChgHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getOrderItemChgHistId() == null || row.getOrderItemChgHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdhOrderItemChgHist::getOrderItemChgHistId, "U", "orderItemChgHistId", this);
        CmUtil.requireRowIds(rows, OdhOrderItemChgHist::getOrderItemChgHistId, "D", "orderItemChgHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdhOrderItemChgHist::getOrderItemChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhOrderItemChgHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdhOrderItemChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderItemChgHist row : updateRows) {
            row.setUpdBy(authId);
            int affected = odhOrderItemChgHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getOrderItemChgHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdhOrderItemChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderItemChgHist row : insertRows) {
            row.setOrderItemChgHistId(CmUtil.generateId("odh_order_item_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhOrderItemChgHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
