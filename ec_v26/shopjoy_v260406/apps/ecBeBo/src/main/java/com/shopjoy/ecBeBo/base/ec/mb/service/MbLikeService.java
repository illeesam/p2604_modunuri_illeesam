package com.shopjoy.ecBeBo.base.ec.mb.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecBeBo.base.ec.mb.repository.MbLikeRepository;
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
public class MbLikeService {

    private final MbLikeRepository mbLikeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 좋아요(찜) 키조회 */
    public MbLikeDto.Item getById(String id) {
        // [QueryDSL] 좋아요 (위시리스트) 단건 조회
        MbLikeDto.Item dto = mbLikeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbLikeDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 좋아요 (위시리스트) 단건 조회
        return mbLikeRepository.selectById(id).orElse(null);
    }

    /* 좋아요(찜) 상세조회 */
    public MbLike findById(String id) {
        // [쿼리 메서드] 좋아요 (위시리스트) 단건 조회
        return mbLikeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbLike findByIdOrNull(String id) {
        // [쿼리 메서드] 좋아요 (위시리스트) 단건 조회
        return mbLikeRepository.findById(id).orElse(null);
    }

    /* 좋아요(찜) 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 좋아요 (위시리스트) 존재 여부 확인
        return mbLikeRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 좋아요 (위시리스트) 존재 여부 확인
        if (!mbLikeRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 좋아요(찜) 목록조회 */
    public List<MbLikeDto.Item> getList(MbLikeDto.Request req) {
        // [QueryDSL] 좋아요 (위시리스트) 목록 조회
        return mbLikeRepository.selectList(req);
    }

    /* 좋아요(찜) 페이지조회 */
    public BasePage<MbLikeDto.Item> getPageData(MbLikeDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 좋아요 (위시리스트) 페이지 조회
        return mbLikeRepository.selectPageData(req);
    }

    /* 좋아요(찜) 등록 */
    @Transactional
    public MbLike create(MbLike body) {
        body.setLikeId(CmUtil.generateId("mb_like"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 좋아요 (위시리스트) 저장
        MbLike saved = mbLikeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 좋아요(찜) 수정 */
    @Transactional
    public MbLike update(String id, MbLike body) {
        CmUtil.requireId(id, "id", this);
        MbLike entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "likeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 좋아요 (위시리스트) 저장
        MbLike saved = mbLikeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 좋아요(찜) 수정 */
    @Transactional
    public MbLike updateSelective(MbLike entity) {
        if (entity.getLikeId() == null) throw new CmBizException("likeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 좋아요 (위시리스트) 선택적 필드 수정
        int affected = mbLikeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 좋아요(찜) 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MbLike entity = findById(id);
        // [쿼리 메서드] 좋아요 (위시리스트) 삭제
        mbLikeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbLike saveOneBase(MbLike entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getLikeId());

        if ("D".equals(rowStatus)) {
            if (entity.getLikeId() == null)
                throw new CmBizException("삭제 대상 likeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 좋아요 (위시리스트) 존재 여부 확인
            if (!mbLikeRepository.existsById(entity.getLikeId()))
                throw new CmBizException("존재하지 않는 MbLike입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 좋아요 (위시리스트) ID 기준 삭제
            mbLikeRepository.deleteById(entity.getLikeId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setLikeId(CmUtil.generateId("mb_like"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 좋아요 (위시리스트) 저장
            MbLike saved = mbLikeRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getLikeId() == null)
                throw new CmBizException("수정 대상 likeId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 좋아요 (위시리스트) 선택적 필드 수정
            int affected = mbLikeRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 MbLike입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getLikeId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<MbLike> rows) {
        /* 0단계: rowStatus 정규화 */
        for (MbLike row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getLikeId() == null || row.getLikeId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MbLike::getLikeId, "U", "likeId", this);
        CmUtil.requireRowIds(rows, MbLike::getLikeId, "D", "likeId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(MbLike::getLikeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 좋아요 (위시리스트) 조건별 삭제
            mbLikeRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<MbLike> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (MbLike row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 좋아요 (위시리스트) 선택적 필드 수정
            int affected = mbLikeRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<MbLike> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbLike row : insertRows) {
            row.setLikeId(CmUtil.generateId("mb_like"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 좋아요 (위시리스트) 저장
            mbLikeRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
