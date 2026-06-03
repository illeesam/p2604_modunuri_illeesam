package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderItemStatusHistRepository;
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
public class OdhOrderItemStatusHistService {

    private final OdhOrderItemStatusHistRepository odhOrderItemStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 주문 아이템 상태 이력 키조회 */
    public OdhOrderItemStatusHistDto.Item getById(String id) {
        OdhOrderItemStatusHistDto.Item dto = odhOrderItemStatusHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderItemStatusHistDto.Item getByIdOrNull(String id) {
        return odhOrderItemStatusHistRepository.selectById(id).orElse(null);
    }

    /* 주문 아이템 상태 이력 상세조회 */
    public OdhOrderItemStatusHist findById(String id) {
        return odhOrderItemStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhOrderItemStatusHist findByIdOrNull(String id) {
        return odhOrderItemStatusHistRepository.findById(id).orElse(null);
    }

    /* 주문 아이템 상태 이력 키검증 */
    public boolean existsById(String id) {
        return odhOrderItemStatusHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhOrderItemStatusHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 주문 아이템 상태 이력 목록조회 */
    public List<OdhOrderItemStatusHistDto.Item> getList(OdhOrderItemStatusHistDto.Request req) {
        return odhOrderItemStatusHistRepository.selectList(req);
    }

    /* 주문 아이템 상태 이력 페이지조회 */
    public OdhOrderItemStatusHistDto.PageResponse getPageData(OdhOrderItemStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhOrderItemStatusHistRepository.selectPageData(req);
    }

    /* 주문 아이템 상태 이력 등록 */
    @Transactional
    public OdhOrderItemStatusHist create(OdhOrderItemStatusHist body) {
        body.setOrderItemStatusHistId(CmUtil.generateId("odh_order_item_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhOrderItemStatusHist saved = odhOrderItemStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 주문 아이템 상태 이력 수정 */
    @Transactional
    public OdhOrderItemStatusHist update(String id, OdhOrderItemStatusHist body) {
        CmUtil.requireId(id, "id", this);
        OdhOrderItemStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderItemStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderItemStatusHist saved = odhOrderItemStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 아이템 상태 이력 수정 */
    @Transactional
    public OdhOrderItemStatusHist updateSelective(OdhOrderItemStatusHist entity) {
        if (entity.getOrderItemStatusHistId() == null) throw new CmBizException("orderItemStatusHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderItemStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhOrderItemStatusHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 주문 아이템 상태 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhOrderItemStatusHist entity = findById(id);
        odhOrderItemStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhOrderItemStatusHist saveOneBase(OdhOrderItemStatusHist entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getOrderItemStatusHistId() == null || entity.getOrderItemStatusHistId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getOrderItemStatusHistId() == null)
                throw new CmBizException("삭제 대상 orderItemStatusHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!odhOrderItemStatusHistRepository.existsById(entity.getOrderItemStatusHistId()))
                throw new CmBizException("존재하지 않는 OdhOrderItemStatusHist입니다: " + entity.getOrderItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
            odhOrderItemStatusHistRepository.deleteById(entity.getOrderItemStatusHistId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setOrderItemStatusHistId(CmUtil.generateId("odh_order_item_status_hist"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            OdhOrderItemStatusHist saved = odhOrderItemStatusHistRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getOrderItemStatusHistId() == null)
                throw new CmBizException("수정 대상 orderItemStatusHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = odhOrderItemStatusHistRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdhOrderItemStatusHist입니다: " + entity.getOrderItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getOrderItemStatusHistId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdhOrderItemStatusHist> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdhOrderItemStatusHist row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getOrderItemStatusHistId() == null || row.getOrderItemStatusHistId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdhOrderItemStatusHist::getOrderItemStatusHistId, "U", "orderItemStatusHistId", this);
        CmUtil.requireRowIds(rows, OdhOrderItemStatusHist::getOrderItemStatusHistId, "D", "orderItemStatusHistId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdhOrderItemStatusHist::getOrderItemStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhOrderItemStatusHistRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdhOrderItemStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderItemStatusHist row : updateRows) {
            row.setUpdBy(authId);
            int affected = odhOrderItemStatusHistRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getOrderItemStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdhOrderItemStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderItemStatusHist row : insertRows) {
            row.setOrderItemStatusHistId(CmUtil.generateId("odh_order_item_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhOrderItemStatusHistRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
