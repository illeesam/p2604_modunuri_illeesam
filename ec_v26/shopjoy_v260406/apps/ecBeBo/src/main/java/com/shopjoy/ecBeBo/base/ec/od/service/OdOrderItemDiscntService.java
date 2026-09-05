package com.shopjoy.ecBeBo.base.ec.od.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdOrderItemDiscntRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
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
public class OdOrderItemDiscntService {

    private final OdOrderItemDiscntRepository odOrderItemDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    /* 주문 아이템 할인 키조회 */
    public OdOrderItemDiscntDto.Item getById(String id) {
        // [QueryDSL] 주문상품할인 내역 (즉시할인·상품쿠폰) 단건 조회
        OdOrderItemDiscntDto.Item dto = odOrderItemDiscntRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrderItemDiscntDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 주문상품할인 내역 (즉시할인·상품쿠폰) 단건 조회
        return odOrderItemDiscntRepository.selectById(id).orElse(null);
    }

    /* 주문 아이템 할인 상세조회 */
    public OdOrderItemDiscnt findById(String id) {
        // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 단건 조회
        return odOrderItemDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrderItemDiscnt findByIdOrNull(String id) {
        // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 단건 조회
        return odOrderItemDiscntRepository.findById(id).orElse(null);
    }

    /* 주문 아이템 할인 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 존재 여부 확인
        return odOrderItemDiscntRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 존재 여부 확인
        if (!odOrderItemDiscntRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 주문 아이템 할인 목록조회 */
    public List<OdOrderItemDiscntDto.Item> getList(OdOrderItemDiscntDto.Request req) {
        // [QueryDSL] 주문상품할인 내역 (즉시할인·상품쿠폰) 목록 조회
        return odOrderItemDiscntRepository.selectList(req);
    }

    /* 주문 아이템 할인 페이지조회 */
    public BasePage<OdOrderItemDiscntDto.Item> getPageData(OdOrderItemDiscntDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 주문상품할인 내역 (즉시할인·상품쿠폰) 페이지 조회
        return odOrderItemDiscntRepository.selectPageData(req);
    }

    /* 주문 아이템 할인 등록 */
    @Transactional
    public OdOrderItemDiscnt create(OdOrderItemDiscnt body) {
        body.setOrderItemDiscntId(CmUtil.generateId("od_order_item_discnt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 저장
        OdOrderItemDiscnt saved = odOrderItemDiscntRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 주문 아이템 할인 수정 */
    @Transactional
    public OdOrderItemDiscnt update(String id, OdOrderItemDiscnt body) {
        CmUtil.requireId(id, "id", this);
        OdOrderItemDiscnt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderItemDiscntId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 저장
        OdOrderItemDiscnt saved = odOrderItemDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 아이템 할인 수정 */
    @Transactional
    public OdOrderItemDiscnt updateSelective(OdOrderItemDiscnt entity) {
        if (entity.getOrderItemDiscntId() == null) throw new CmBizException("orderItemDiscntId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderItemDiscntId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderItemDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 주문상품할인 내역 (즉시할인·상품쿠폰) 선택적 필드 수정
        int affected = odOrderItemDiscntRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 주문 아이템 할인 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdOrderItemDiscnt entity = findById(id);
        // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 삭제
        odOrderItemDiscntRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdOrderItemDiscnt saveOneBase(OdOrderItemDiscnt entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getOrderItemDiscntId());

        if ("D".equals(rowStatus)) {
            if (entity.getOrderItemDiscntId() == null)
                throw new CmBizException("삭제 대상 orderItemDiscntId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 존재 여부 확인
            if (!odOrderItemDiscntRepository.existsById(entity.getOrderItemDiscntId()))
                throw new CmBizException("존재하지 않는 OdOrderItemDiscnt입니다: " + entity.getOrderItemDiscntId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) ID 기준 삭제
            odOrderItemDiscntRepository.deleteById(entity.getOrderItemDiscntId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setOrderItemDiscntId(CmUtil.generateId("od_order_item_discnt"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 저장
            OdOrderItemDiscnt saved = odOrderItemDiscntRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getOrderItemDiscntId() == null)
                throw new CmBizException("수정 대상 orderItemDiscntId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 주문상품할인 내역 (즉시할인·상품쿠폰) 선택적 필드 수정
            int affected = odOrderItemDiscntRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 OdOrderItemDiscnt입니다: " + entity.getOrderItemDiscntId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getOrderItemDiscntId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<OdOrderItemDiscnt> rows) {
        /* 0단계: rowStatus 정규화 */
        for (OdOrderItemDiscnt row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getOrderItemDiscntId() == null || row.getOrderItemDiscntId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, OdOrderItemDiscnt::getOrderItemDiscntId, "U", "orderItemDiscntId", this);
        CmUtil.requireRowIds(rows, OdOrderItemDiscnt::getOrderItemDiscntId, "D", "orderItemDiscntId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(OdOrderItemDiscnt::getOrderItemDiscntId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 조건별 삭제
            odOrderItemDiscntRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<OdOrderItemDiscnt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (OdOrderItemDiscnt row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 주문상품할인 내역 (즉시할인·상품쿠폰) 선택적 필드 수정
            int affected = odOrderItemDiscntRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getOrderItemDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<OdOrderItemDiscnt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdOrderItemDiscnt row : insertRows) {
            row.setOrderItemDiscntId(CmUtil.generateId("od_order_item_discnt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 주문상품할인 내역 (즉시할인·상품쿠폰) 저장
            odOrderItemDiscntRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
