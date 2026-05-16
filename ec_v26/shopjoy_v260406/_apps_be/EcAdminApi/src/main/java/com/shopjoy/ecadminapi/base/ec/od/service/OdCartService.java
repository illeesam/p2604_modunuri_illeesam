package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdCartRepository;
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
public class OdCartService {

    private final OdCartRepository odCartRepository;

    @PersistenceContext
    private EntityManager em;

    /* 장바구니 키조회 */
    public OdCartDto.Item getById(String id) {
        OdCartDto.Item dto = odCartRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdCartDto.Item getByIdOrNull(String id) {
        return odCartRepository.selectById(id).orElse(null);
    }

    /* 장바구니 상세조회 */
    public OdCart findById(String id) {
        return odCartRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdCart findByIdOrNull(String id) {
        return odCartRepository.findById(id).orElse(null);
    }

    /* 장바구니 키검증 */
    public boolean existsById(String id) {
        return odCartRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odCartRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 장바구니 목록조회 */
    public List<OdCartDto.Item> getList(OdCartDto.Request req) {
        return odCartRepository.selectList(req);
    }

    /* 장바구니 페이지조회 */
    public OdCartDto.PageResponse getPageData(OdCartDto.Request req) {
        PageHelper.addPaging(req);
        return odCartRepository.selectPageList(req);
    }

    /* 장바구니 등록 */
    @Transactional
    public OdCart create(OdCart body) {
        body.setCartId(CmUtil.generateId("od_cart"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdCart saved = odCartRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 장바구니 저장 */
    @Transactional
    public OdCart save(OdCart entity) {
        if (!existsById(entity.getCartId()))
            throw new CmBizException("존재하지 않는 OdCart입니다: " + entity.getCartId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdCart saved = odCartRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 장바구니 수정 */
    @Transactional
    public OdCart update(String id, OdCart body) {
        OdCart entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "cartId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdCart saved = odCartRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 장바구니 수정 */
    @Transactional
    public OdCart updateSelective(OdCart entity) {
        if (entity.getCartId() == null) throw new CmBizException("cartId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCartId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCartId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odCartRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 장바구니 삭제 */
    @Transactional
    public void delete(String id) {
        OdCart entity = findById(id);
        odCartRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 장바구니 목록저장 */
    @Transactional
    public void saveList(List<OdCart> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCartId() != null)
            .map(OdCart::getCartId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odCartRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdCart> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCartId() != null)
            .toList();
        for (OdCart row : updateRows) {
            OdCart entity = findById(row.getCartId());
            VoUtil.voCopyExclude(row, entity, "cartId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odCartRepository.save(entity);
        }
        em.flush();

        List<OdCart> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdCart row : insertRows) {
            row.setCartId(CmUtil.generateId("od_cart"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odCartRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
