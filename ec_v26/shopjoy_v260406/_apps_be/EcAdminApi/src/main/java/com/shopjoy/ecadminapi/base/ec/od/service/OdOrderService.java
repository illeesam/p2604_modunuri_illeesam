package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OdOrderService {

    private final OdOrderRepository odOrderRepository;

    @PersistenceContext
    private EntityManager em;

    /* 주문 키조회 */
    public OdOrderDto.Item getById(String id) {
        OdOrderDto.Item dto = odOrderRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrderDto.Item getByIdOrNull(String id) {
        return odOrderRepository.selectById(id).orElse(null);
    }

    /* 주문 상세조회 */
    public OdOrder findById(String id) {
        return odOrderRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrder findByIdOrNull(String id) {
        return odOrderRepository.findById(id).orElse(null);
    }

    /* 주문 키검증 */
    public boolean existsById(String id) {
        return odOrderRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odOrderRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 주문 목록조회 */
    public List<OdOrderDto.Item> getList(OdOrderDto.Request req) {
        return odOrderRepository.selectList(req);
    }

    /* 주문 페이지조회 */
    public OdOrderDto.PageResponse getPageData(OdOrderDto.Request req) {
        PageHelper.addPaging(req);
        return odOrderRepository.selectPageData(req);
    }

    /* 주문 등록 */
    @Transactional
    public OdOrder create(OdOrder body) {
        body.setOrderId(CmUtil.generateId("od_order"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 주문 수정 */
    @Transactional
    public OdOrder update(String id, OdOrder body) {
        CmUtil.requireId(id, "id", this);
        OdOrder entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 수정 */
    @Transactional
    public OdOrder updateSelective(OdOrder entity) {
        if (entity.getOrderId() == null) throw new CmBizException("orderId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odOrderRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 주문 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdOrder entity = findById(id);
        odOrderRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdOrder save(String cmd, OdOrder entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getOrderId() == null || entity.getOrderId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getOrderId() == null)
                    throw new CmBizException("삭제 대상 orderId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!odOrderRepository.existsById(entity.getOrderId()))
                    throw new CmBizException("존재하지 않는 OdOrder입니다: " + entity.getOrderId() + "::" + CmUtil.svcCallerInfo(this));
                odOrderRepository.deleteById(entity.getOrderId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setOrderId(CmUtil.generateId("od_order"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                OdOrder saved = odOrderRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getOrderId() == null)
                    throw new CmBizException("수정 대상 orderId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = odOrderRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 OdOrder입니다: " + entity.getOrderId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getOrderId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<OdOrder> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (OdOrder row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getOrderId() == null || row.getOrderId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, OdOrder::getOrderId, "U", "orderId", this);
            CmUtil.requireRowIds(rows, OdOrder::getOrderId, "D", "orderId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(OdOrder::getOrderId)
                .toList();
            if (!deleteIds.isEmpty()) {
                odOrderRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<OdOrder> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (OdOrder row : updateRows) {
                row.setUpdBy(authId);
                int affected = odOrderRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getOrderId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<OdOrder> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (OdOrder row : insertRows) {
                row.setOrderId(CmUtil.generateId("od_order"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odOrderRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
